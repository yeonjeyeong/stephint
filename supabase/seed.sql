-- Optional development seed for local/demo environments.
-- Run after schema.sql.

create extension if not exists pgcrypto;

do $$
declare
  teacher_id uuid := '11111111-1111-4111-8111-111111111111';
  student_one_id uuid := '22222222-2222-4222-8222-222222222222';
  student_two_id uuid := '33333333-3333-4333-8333-333333333333';
begin
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  values
    (
      '00000000-0000-0000-0000-000000000000',
      student_one_id,
      'authenticated',
      'authenticated',
      'student.one@example.com',
      crypt('Student!123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"student","username":"student.one","display_name":"Student One"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      student_two_id,
      'authenticated',
      'authenticated',
      'student.two@example.com',
      crypt('Student!234', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"student","username":"student.two","display_name":"Student Two"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      teacher_id,
      'authenticated',
      'authenticated',
      'teacher.one@example.com',
      crypt('Teacher!123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"teacher","username":"teacher.one","display_name":"Teacher One"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    )
  on conflict (id) do update
  set
    email = excluded.email,
    raw_user_meta_data = excluded.raw_user_meta_data,
    updated_at = now();

  update public.profiles
  set
    teacher_approved = true,
    updated_at = now()
  where id in (student_one_id, student_two_id);

  update public.profiles
  set
    teacher_approved = true,
    is_teacher_admin = true,
    updated_at = now()
  where id = teacher_id;

  insert into public.teacher_student_links (teacher_id, student_id)
  values
    (teacher_id, student_one_id),
    (teacher_id, student_two_id)
  on conflict do nothing;

  insert into public.submissions (
    id,
    user_id,
    problem_image_url,
    solution_image_url,
    student_note,
    problem_ocr_text,
    solution_ocr_text,
    status,
    created_at
  )
  values
    (
      '44444444-4444-4444-8444-444444444441',
      student_one_id,
      'https://placehold.co/1200x900/png?text=StepHint+Problem+1',
      'https://placehold.co/1200x900/png?text=StepHint+Solution+1',
      '이항할 때 부호가 자꾸 헷갈립니다.',
      '2x + 5 = 11',
      '2x + 5 = 11 / 2x = 11 + 5',
      'completed',
      now() - interval '2 day'
    ),
    (
      '44444444-4444-4444-8444-444444444442',
      student_one_id,
      'https://placehold.co/1200x900/png?text=StepHint+Problem+2',
      'https://placehold.co/1200x900/png?text=StepHint+Solution+2',
      '인수분해에서 합과 곱을 자꾸 바꿔 봅니다.',
      'x^2 + 5x + 6',
      '(x + 2)(x + 2)',
      'completed',
      now() - interval '1 day'
    ),
    (
      '44444444-4444-4444-8444-444444444443',
      student_two_id,
      'https://placehold.co/1200x900/png?text=StepHint+Problem+3',
      'https://placehold.co/1200x900/png?text=StepHint+Solution+3',
      '소거법에서 계수를 어떻게 맞춰야 할지 모르겠습니다.',
      '2x + 3y = 12 / 4x + y = 10',
      '2x + 3y = 12 / 4x + y = 10 / x를 없애려다 실패',
      'completed',
      now() - interval '12 hour'
    ),
    (
      '44444444-4444-4444-8444-444444444444',
      student_two_id,
      'https://placehold.co/1200x900/png?text=StepHint+Problem+4',
      'https://placehold.co/1200x900/png?text=StepHint+Solution+4',
      '분석 중 fallback 예시를 보여주기 위한 샘플입니다.',
      'x^2 - 4 = 0',
      'x^2 - 4 / x = ...',
      'completed',
      now() - interval '4 hour'
    )
  on conflict (id) do update
  set
    problem_image_url = excluded.problem_image_url,
    solution_image_url = excluded.solution_image_url,
    student_note = excluded.student_note,
    problem_ocr_text = excluded.problem_ocr_text,
    solution_ocr_text = excluded.solution_ocr_text,
    status = excluded.status,
    created_at = excluded.created_at;

  insert into public.diagnoses (
    id,
    submission_id,
    problem_type,
    progress_summary,
    stuck_point,
    misconception_tags,
    concepts_to_review,
    next_hint,
    retry_question,
    answer_revealed,
    provider_name,
    prompt_version,
    leakage_guard_passed,
    fallback_used,
    created_at
  )
  values
    (
      '55555555-5555-4555-8555-555555555551',
      '44444444-4444-4444-8444-444444444441',
      '일차방정식',
      '미지수를 한쪽으로 모으려는 방향은 좋았습니다.',
      '이항할 때 부호가 바뀌어야 하는데 그대로 옮긴 것으로 보입니다.',
      '["부호 오류", "이항 규칙 혼동"]'::jsonb,
      '["등식의 성질", "음수 연산"]'::jsonb,
      '5를 오른쪽으로 옮길 때 식이 어떻게 바뀌는지 먼저 말로 적어보세요.',
      '2x + 5 = 11에서 5를 오른쪽으로 옮기면 식이 어떻게 바뀌나요?',
      false,
      'gemini',
      'gemini-diagnosis-v3',
      true,
      false,
      now() - interval '2 day'
    ),
    (
      '55555555-5555-4555-8555-555555555552',
      '44444444-4444-4444-8444-444444444442',
      '이차방정식',
      '인수분해를 시도한 점은 좋았고, 합과 곱을 찾으려는 방향도 맞았습니다.',
      '합과 곱의 대응 관계가 뒤바뀌어 잘못된 인수 조합을 만든 것으로 보입니다.',
      '["인수분해 오개념", "합-곱 관계 혼동"]'::jsonb,
      '["인수분해 공식", "이차식 구조"]'::jsonb,
      '(x+a)(x+b) 형태에서 a+b와 a*b가 원래 식의 어느 부분에 해당하는지 다시 확인해 보세요.',
      '곱이 6이고 합이 5가 되는 두 수를 먼저 떠올려볼까요?',
      false,
      'gemini',
      'gemini-diagnosis-v3',
      true,
      false,
      now() - interval '1 day'
    ),
    (
      '55555555-5555-4555-8555-555555555553',
      '44444444-4444-4444-8444-444444444443',
      '연립방정식',
      '소거법을 적용하려는 방향은 맞고, 두 식을 비교하려는 시도도 좋았습니다.',
      '없애려는 변수의 계수를 맞추는 단계에서 어떤 식에 무엇을 곱해야 하는지 혼동한 것으로 보입니다.',
      '["소거법 절차 오류", "계수 맞추기 실수"]'::jsonb,
      '["소거법 절차", "최소공배수 활용"]'::jsonb,
      '없애고 싶은 변수의 계수를 같은 수로 만들려면 각 식에 어떤 수를 곱해야 하는지 먼저 적어보세요.',
      'x를 소거하려면 첫 번째 식과 두 번째 식의 x 계수를 각각 어떻게 맞춰야 하나요?',
      false,
      'gemini',
      'gemini-diagnosis-v3',
      true,
      false,
      now() - interval '12 hour'
    ),
    (
      '55555555-5555-4555-8555-555555555554',
      '44444444-4444-4444-8444-444444444444',
      '이차방정식',
      '제곱식 구조를 보며 풀이를 시작한 점은 좋았습니다.',
      '현재 입력만으로는 막힌 지점을 충분히 특정하지 못했습니다.',
      '["추가 풀이 정보 필요"]'::jsonb,
      '["문제 조건 정리", "직전 단계 검토"]'::jsonb,
      '식의 좌변이 어떤 형태인지 먼저 분류하고, 바로 적용할 수 있는 공식이 있는지 확인해 보세요.',
      'x^2 - 4를 보면 먼저 어떤 공식이 떠오르나요?',
      false,
      'gemini',
      'provider-error',
      false,
      true,
      now() - interval '4 hour'
    )
  on conflict (id) do update
  set
    problem_type = excluded.problem_type,
    progress_summary = excluded.progress_summary,
    stuck_point = excluded.stuck_point,
    misconception_tags = excluded.misconception_tags,
    concepts_to_review = excluded.concepts_to_review,
    next_hint = excluded.next_hint,
    retry_question = excluded.retry_question,
    answer_revealed = excluded.answer_revealed,
    provider_name = excluded.provider_name,
    prompt_version = excluded.prompt_version,
    leakage_guard_passed = excluded.leakage_guard_passed,
    fallback_used = excluded.fallback_used,
    created_at = excluded.created_at;
end $$;
