import { NextRequest, NextResponse } from 'next/server';
import { initSchema } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// POST /api/init - Initialize database schema
// Run once after creating Vercel Postgres database
export async function POST(request: NextRequest) {
  const auth = verifyAuth(request);
  if (!auth.authenticated) return auth.response;

  try {
    await initSchema();
    return NextResponse.json({ success: true, message: 'Schema initialized' });
  } catch (error) {
    console.error('Error initializing schema:', error);
    return NextResponse.json(
      { error: 'Failed to initialize schema', details: String(error) },
      { status: 500 }
    );
  }
}
