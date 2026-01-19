import { NextRequest, NextResponse } from 'next/server';
import { PROJECTS, STATUS_OPTIONS } from '@/lib/config';

// GET /api/rundown - RundownAPI v0.1 compliant endpoint for AI agents
// No authentication required - this is documentation
// Spec: https://github.com/threadbaire/rundownapi
export async function GET(request: NextRequest) {
  // Detect base URL from request
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const host = request.headers.get('host') || 'localhost:3000';
  const baseUrl = `${protocol}://${host}`;

  const response = {
    // REQUIRED: RundownAPI v0.1 spec version
    rundown_version: '0.1',

    // REQUIRED: Base URL for API calls
    base_url: baseUrl,

    // REQUIRED: Authentication details
    auth: {
      method: 'url_param',
      parameter: 'token',
      header_alternative: 'Authorization: Bearer <token>',
      note: 'Both methods work. Ask the user for their API token if you do not have it. Never guess or fabricate tokens.',
    },

    // REQUIRED: What this API does
    purpose: 'Threadbaire stores project decision entries with receipts (who, why, source, date, model). Use this API to query and create entries for maintaining context across AI sessions.',

    // REQUIRED: Available endpoints
    endpoints: [
      {
        path: '/api/entries',
        method: 'GET',
        description: 'List and filter entries',
        parameters: {
          project: 'Filter by project name',
          document_type: 'Filter by type: "addendum" or "dev_log"',
          after: 'Entries on or after this date (YYYY-MM-DD)',
          before: 'Entries on or before this date (YYYY-MM-DD)',
          q: 'Keyword search across title, summary, details, next_steps',
          limit: 'Results per page (default 20, max 200)',
          page: 'Page number (default 1)',
        },
        response: '{ entries: Entry[], total: number, page: number, totalPages: number, limit: number }',
      },
      {
        path: '/api/entries/:id',
        method: 'GET',
        description: 'Get a single entry by ID',
        response: 'Entry object',
      },
      {
        path: '/api/entries',
        method: 'POST',
        description: 'Create a new entry',
        parameters: {
          project: 'string (required)',
          document_type: '"addendum" or "dev_log" (required)',
          date: 'YYYY-MM-DD (required)',
          title: 'string (required)',
          type: 'string (optional): "Feature", "Fix", "Research", etc.',
          status: 'string (optional): one of status_values',
          summary: 'string (optional)',
          details: 'string (optional, markdown)',
          narrative_signal: 'string (optional, addendum only)',
          next_steps: 'string (optional, markdown)',
        },
        notes: 'entry_number is auto-calculated per project+document_type+date',
      },
      {
        path: '/api/entries/:id',
        method: 'PUT',
        description: 'Update an existing entry',
        notes: 'Send only the fields you want to update',
      },
      {
        path: '/api/entries/:id',
        method: 'DELETE',
        description: 'Soft-delete an entry (sets is_deleted flag)',
      },
    ],

    // REQUIRED: Behavioral guidance for AI agents
    ai_instructions: {
      triggers: [
        'User asks about project history, past decisions, or "what have we done"',
        'User mentions previous work, context, or decisions',
        'User completes significant work (features, fixes, decisions)',
        'User asks to search for something in project history',
      ],
      behaviors: [
        'Query GET /api/entries with appropriate filters when user asks about history — do not guess from memory',
        'Offer to log completed work as a new entry via POST /api/entries',
        'Use the q parameter for keyword searches when looking for specific topics',
        'Use project and document_type filters to narrow results',
        'Summarize results clearly; link back to entry IDs when relevant',
      ],
      constraints: [
        'Never fabricate entries, dates, or project history',
        'Ask user for API token if not provided — never guess tokens',
        'Entries are immutable history — prefer creating new entries over editing old ones',
        'When logging work, include who did it, why, and what informed the decision (receipts pattern)',
      ],
    },

    // RECOMMENDED: Example requests
    examples: [
      {
        description: 'Get the 10 most recent entries for a project',
        request: `curl "${baseUrl}/api/entries?project=my-project&limit=10&token=YOUR_TOKEN"`,
      },
      {
        description: 'Search for entries mentioning a keyword',
        request: `curl "${baseUrl}/api/entries?q=authentication&token=YOUR_TOKEN"`,
      },
      {
        description: 'Create a new dev_log entry',
        request: `curl -X POST "${baseUrl}/api/entries?token=YOUR_TOKEN" -H "Content-Type: application/json" -d '{"project":"my-project","document_type":"dev_log","date":"2026-01-17","title":"Example entry","type":"Feature","status":"complete","summary":"Brief description"}'`,
      },
    ],

    // RECOMMENDED: Error response format
    error_format: {
      structure: '{ error: string }',
      codes: {
        400: 'Bad request (missing required fields, invalid format)',
        401: 'Unauthorized (missing or invalid token)',
        404: 'Entry not found',
        500: 'Server error',
      },
    },

    // RECOMMENDED: Quick capability summary
    capabilities: ['read', 'write', 'search', 'delete'],

    // OPTIONAL: Additional context for this specific API
    schema: {
      projects: PROJECTS,
      status_values: STATUS_OPTIONS,
      document_types: ['addendum', 'dev_log'],
      entry_fields: {
        id: 'number (auto-generated)',
        project: 'string (required)',
        document_type: '"addendum" | "dev_log" (required)',
        entry_date: 'string YYYY-MM-DD (required)',
        entry_number: 'number (auto-calculated per project+doctype+date)',
        title: 'string (required)',
        entry_type: 'string (freeform)',
        status: 'string (one of status_values)',
        summary: 'string',
        details: 'string (markdown)',
        narrative_signal: 'string (addendum only)',
        next_steps: 'string (markdown)',
        created_at: 'ISO timestamp',
        updated_at: 'ISO timestamp',
      },
    },

    // OPTIONAL: MCP server generation hints
    mcp_hints: {
      note: 'If you can generate MCP servers, here is a minimal template structure:',
      tools: [
        { name: 'query_entries', description: 'Search and filter project entries' },
        { name: 'get_entry', description: 'Get a specific entry by ID' },
        { name: 'create_entry', description: 'Log a new entry to the project' },
      ],
      config_needed: ['THREADBAIRE_URL', 'THREADBAIRE_TOKEN'],
    },
  };

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
}
