import { NextRequest, NextResponse } from 'next/server';
import { getEntry, updateEntry, deleteEntry } from '@/lib/db';
import { normalizeStatus } from '@/lib/types';
import { verifyAuth } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/entries/:id - Get single entry
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = verifyAuth(request);
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;
    const entryId = parseInt(id, 10);

    if (isNaN(entryId)) {
      return NextResponse.json(
        { error: 'Invalid entry ID' },
        { status: 400 }
      );
    }

    const entry = await getEntry(entryId);

    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Error getting entry:', error);
    return NextResponse.json(
      { error: 'Failed to get entry' },
      { status: 500 }
    );
  }
}

// PUT /api/entries/:id - Update entry
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const auth = verifyAuth(request);
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;
    const entryId = parseInt(id, 10);

    if (isNaN(entryId)) {
      return NextResponse.json(
        { error: 'Invalid entry ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate required fields - title must not be empty if provided
    if (body.title !== undefined && !body.title.trim()) {
      return NextResponse.json(
        { error: 'Title cannot be empty' },
        { status: 400 }
      );
    }

    // Validate date format if provided (YYYY-MM-DD)
    if (body.date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      return NextResponse.json(
        { error: 'date must be in YYYY-MM-DD format' },
        { status: 400 }
      );
    }

    const updated = await updateEntry(entryId, {
      entry_date: body.date,
      title: body.title,
      entry_type: body.type,
      status: body.status ? normalizeStatus(body.status) : undefined,
      summary: body.summary,
      details: body.details,
      narrative_signal: body.narrative_signal,
      next_steps: body.next_steps,
    });

    if (!updated) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating entry:', error);
    return NextResponse.json(
      { error: 'Failed to update entry' },
      { status: 500 }
    );
  }
}

// DELETE /api/entries/:id - Soft delete entry
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = verifyAuth(request);
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;
    const entryId = parseInt(id, 10);

    if (isNaN(entryId)) {
      return NextResponse.json(
        { error: 'Invalid entry ID' },
        { status: 400 }
      );
    }

    const deleted = await deleteEntry(entryId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete entry' },
      { status: 500 }
    );
  }
}
