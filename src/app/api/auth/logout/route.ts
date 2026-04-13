import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/db/supabase';

export async function POST() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
