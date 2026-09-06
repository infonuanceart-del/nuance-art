import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE } from '@/lib/auth';

export async function POST() {
  (await cookies()).set(COOKIE, '', { path: '/', maxAge: 0 });
  return NextResponse.json({ ok: true });
}
