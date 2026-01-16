import { NextRequest, NextResponse } from 'next/server';
import { listEntries, createEntry } from '@/lib/db';
import { normalizeStatus } from '@/lib/types';
import { verifyAuth } from '@/lib/auth';

// GET /api/entries - List entries with optional filters
export async function GET(request: NextRequest) {
  const auth = verifyAuth(request);
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);

    // Pagination: support both page-based and offset-based
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 20;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1;
    const offset = searchParams.get('offset')
      ? parseInt(searchParams.get('offset')!, 10)
      : (page - 1) * limit;

    const filters = {
      project: searchParams.get('project') || undefined,
      document_type: (searchParams.get('document_type') as 'addendum' | 'dev_log') || undefined,
      after: searchParams.get('after') || undefined,
      before: searchParams.get('before') || undefined,
      q: searchParams.get('q') || undefined,
      limit,
      offset,
    };

    const result = await listEntries(filters);
    const totalPages = Math.ceil(result.total / limit);

    return NextResponse.json({
      entries: result.entries,
      total: result.total,
      page,
      totalPages,
      limit,
    });
  } catch (error) {
    console.error('Error listing entries:', error);
    return NextResponse.json(
      { error: 'Failed to list entries' },
      { status: 500 }
    );
  }
}

// POST /api/entries - Create a new entry
export async function POST(request: NextRequest) {
  const auth = verifyAuth(request);
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.project || !body.document_type || !body.date || !body.title) {
      return NextResponse.json(
        { error: 'Missing required fields: project, document_type, date, title' },
        { status: 400 }
      );
    }

    // Validate document_type
    if (!['addendum', 'dev_log'].includes(body.document_type)) {
      return NextResponse.json(
        { error: 'document_type must be "addendum" or "dev_log"' },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      return NextResponse.json(
        { error: 'date must be in YYYY-MM-DD format' },
        { status: 400 }
      );
    }

    const entry = await createEntry({
      project: body.project,
      document_type: body.document_type,
      entry_date: body.date,
      title: body.title,
      entry_type: body.type || undefined,
      status: body.status ? normalizeStatus(body.status) : undefined,
      summary: body.summary || undefined,
      details: body.details || undefined,
      narrative_signal: body.narrative_signal || undefined,
      next_steps: body.next_steps || undefined,
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error('Error creating entry:', error);
    return NextResponse.json(
      { error: 'Failed to create entry' },
      { status: 500 }
    );
  }
}
