-- ==========================================
-- StepHint Supabase schema
-- Run this in Supabase SQL Editor.
-- ==========================================

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  username text not null unique,
  display_name text not null,
  role text not null check (role in ('student', 'teacher')),
  teacher_approved boolean not null default false,
  is_teacher_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists teacher_approved boolean not null default false;

alter table public.profiles
  add column if not exists is_teacher_admin boolean not null default false;

update public.profiles
set
  teacher_approved = case
    when role = 'student' then true
    when email = 'teacher.one@example.com' then true
    else teacher_approved
  end,
  is_teacher_admin = case
    when email = 'teacher.one@example.com' then true
    else is_teacher_admin
  end,
  updated_at = now()
where role in ('student', 'teacher');

create table if not exists public.teacher_student_links (
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (teacher_id, student_id),
  constraint teacher_student_links_no_self check (teacher_id <> student_id)
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  problem_image_url text not null,
  solution_image_url text not null,
  student_note text,
  problem_ocr_text text,
  solution_ocr_text text,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  created_at timestamptz not null default now()
);

create table if not exists public.diagnoses (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique references public.submissions (id) on delete cascade,
  problem_type text not null,
  progress_summary text not null,
  stuck_point text not null,
  misconception_tags jsonb not null default '[]'::jsonb,
  concepts_to_review jsonb not null default '[]'::jsonb,
  next_hint text not null,
  retry_question text not null,
  answer_revealed boolean not null default false,
  provider_name text not null default 'gemini',
  prompt_version text not null default 'gemini-diagnosis-v3',
  leakage_guard_passed boolean not null default true,
  fallback_used boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_teacher_student_links_teacher on public.teacher_student_links (teacher_id);
create index if not exists idx_teacher_student_links_student on public.teacher_student_links (student_id);
create index if not exists idx_submissions_user_id on public.submissions (user_id);
create index if not exists idx_submissions_created_at on public.submissions (created_at desc);
create index if not exists idx_diagnoses_submission_id on public.diagnoses (submission_id);

create or replace function public.handle_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute procedure public.handle_profile_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text;
  normalized_username text;
  resolved_display_name text;
  resolved_role text;
  admin_teacher boolean;
begin
  normalized_email := lower(trim(coalesce(new.email, '')));
  normalized_username := lower(trim(coalesce(new.raw_user_meta_data ->> 'username', '')));
  resolved_display_name := coalesce(
    new.raw_user_meta_data ->> 'display_name',
    split_part(coalesce(new.email, ''), '@', 1)
  );
  resolved_role := case
    when coalesce(new.raw_user_meta_data ->> 'role', 'student') in ('student', 'teacher')
      then new.raw_user_meta_data ->> 'role'
    else 'student'
  end;
  admin_teacher := resolved_role = 'teacher' and normalized_email = 'teacher.one@example.com';

  insert into public.profiles (
    id,
    email,
    username,
    display_name,
    role,
    teacher_approved,
    is_teacher_admin
  )
  values (
    new.id,
    normalized_email,
    normalized_username,
    resolved_display_name,
    resolved_role,
    case
      when resolved_role = 'teacher' then admin_teacher
      else true
    end,
    admin_teacher
  )
  on conflict (id) do update
  set
    email = excluded.email,
    username = excluded.username,
    display_name = excluded.display_name,
    role = excluded.role,
    teacher_approved = case
      when public.profiles.is_teacher_admin or excluded.is_teacher_admin then true
      when excluded.role = 'teacher' then public.profiles.teacher_approved
      else true
    end,
    is_teacher_admin = public.profiles.is_teacher_admin or excluded.is_teacher_admin,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

create or replace function public.link_student_by_identifier(lookup_identifier text)
returns table (
  student_id uuid,
  student_email text,
  student_username text,
  student_display_name text,
  linked_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  requesting_role text;
  target_student public.profiles%rowtype;
begin
  select role into requesting_role
  from public.profiles
  where id = auth.uid();

  if requesting_role is distinct from 'teacher' then
    raise exception 'Only teachers can link students.';
  end if;

  select *
  into target_student
  from public.profiles
  where role = 'student'
    and (
      lower(username) = lower(trim(lookup_identifier))
      or lower(email) = lower(trim(lookup_identifier))
    )
  limit 1;

  if target_student.id is null then
    raise exception 'Student not found.';
  end if;

  insert into public.teacher_student_links (teacher_id, student_id)
  values (auth.uid(), target_student.id)
  on conflict do nothing;

  return query
  select
    target_student.id,
    target_student.email,
    target_student.username,
    target_student.display_name,
    (
      select links.created_at
      from public.teacher_student_links as links
      where links.teacher_id = auth.uid()
        and links.student_id = target_student.id
    );
end;
$$;

create or replace function public.get_pending_teacher_approvals()
returns table (
  id uuid,
  email text,
  username text,
  display_name text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'teacher'
      and profiles.teacher_approved = true
      and profiles.is_teacher_admin = true
  ) then
    raise exception 'Only the admin teacher can view pending approvals.';
  end if;

  return query
  select
    profiles.id,
    profiles.email,
    profiles.username,
    profiles.display_name,
    profiles.created_at
  from public.profiles
  where profiles.role = 'teacher'
    and profiles.teacher_approved = false
    and profiles.is_teacher_admin = false
  order by profiles.created_at asc;
end;
$$;

create or replace function public.approve_teacher_account(target_teacher_id uuid)
returns table (
  id uuid,
  email text,
  username text,
  display_name text,
  teacher_approved boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  approved_teacher public.profiles%rowtype;
begin
  if not exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'teacher'
      and profiles.teacher_approved = true
      and profiles.is_teacher_admin = true
  ) then
    raise exception 'Only the admin teacher can approve teachers.';
  end if;

  update public.profiles
  set
    teacher_approved = true,
    updated_at = now()
  where profiles.id = target_teacher_id
    and profiles.role = 'teacher'
  returning * into approved_teacher;

  if approved_teacher.id is null then
    raise exception 'Teacher account not found.';
  end if;

  return query
  select
    approved_teacher.id,
    approved_teacher.email,
    approved_teacher.username,
    approved_teacher.display_name,
    approved_teacher.teacher_approved;
end;
$$;

insert into storage.buckets (id, name, public)
values ('submission-images', 'submission-images', false)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public;

alter table public.profiles enable row level security;
alter table public.teacher_student_links enable row level security;
alter table public.submissions enable row level security;
alter table public.diagnoses enable row level security;

drop policy if exists "profiles_select_own_or_linked" on public.profiles;
create policy "profiles_select_own_or_linked"
on public.profiles
for select
using (
  id = auth.uid()
  or exists (
    select 1
    from public.teacher_student_links links
    where links.teacher_id = auth.uid()
      and links.student_id = profiles.id
  )
);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "teacher_links_select_own" on public.teacher_student_links;
create policy "teacher_links_select_own"
on public.teacher_student_links
for select
using (teacher_id = auth.uid());

drop policy if exists "teacher_links_insert_own" on public.teacher_student_links;
create policy "teacher_links_insert_own"
on public.teacher_student_links
for insert
with check (teacher_id = auth.uid());

drop policy if exists "teacher_links_delete_own" on public.teacher_student_links;
create policy "teacher_links_delete_own"
on public.teacher_student_links
for delete
using (teacher_id = auth.uid());

drop policy if exists "students_manage_own_submissions" on public.submissions;
create policy "students_manage_own_submissions"
on public.submissions
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "teachers_read_linked_submissions" on public.submissions;
create policy "teachers_read_linked_submissions"
on public.submissions
for select
using (
  exists (
    select 1
    from public.teacher_student_links links
    where links.teacher_id = auth.uid()
      and links.student_id = submissions.user_id
  )
);

drop policy if exists "students_manage_own_diagnoses" on public.diagnoses;
create policy "students_manage_own_diagnoses"
on public.diagnoses
for all
using (
  exists (
    select 1
    from public.submissions
    where submissions.id = diagnoses.submission_id
      and submissions.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.submissions
    where submissions.id = diagnoses.submission_id
      and submissions.user_id = auth.uid()
  )
);

drop policy if exists "teachers_read_linked_diagnoses" on public.diagnoses;
create policy "teachers_read_linked_diagnoses"
on public.diagnoses
for select
using (
  exists (
    select 1
    from public.submissions
    join public.teacher_student_links links
      on links.student_id = public.submissions.user_id
    where public.submissions.id = diagnoses.submission_id
      and links.teacher_id = auth.uid()
  )
);

drop policy if exists "submission_images_select_owner_or_linked" on storage.objects;
create policy "submission_images_select_owner_or_linked"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'submission-images'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or exists (
      select 1
      from public.teacher_student_links links
      where links.teacher_id = auth.uid()
        and links.student_id::text = (storage.foldername(name))[1]
    )
  )
);

drop policy if exists "submission_images_insert_owner" on storage.objects;
create policy "submission_images_insert_owner"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'submission-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "submission_images_update_owner" on storage.objects;
create policy "submission_images_update_owner"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'submission-images'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'submission-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "submission_images_delete_owner" on storage.objects;
create policy "submission_images_delete_owner"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'submission-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);
