/**
 * API Key Authentication
 *
 * All API endpoints require token authentication.
 * Token can be provided via:
 *   - Header: Authorization: Bearer <token>
 *   - URL parameter: ?token=<token>
 * Token must match API_KEY environment variable.
 */

import { NextRequest, NextResponse } from 'next/server';

export type AuthResult =
  | { authenticated: true }
  | { authenticated: false; response: NextResponse };

/**
 * Verify API key from Authorization header or URL parameter.
 * Returns authenticated: true if valid, or a 401 response if not.
 */
export function verifyAuth(request: NextRequest): AuthResult {
  const apiKey = process.env.API_KEY;

  // If no API_KEY configured, reject all requests (fail secure)
  if (!apiKey) {
    console.error('API_KEY environment variable not set');
    return {
      authenticated: false,
      response: NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      ),
    };
  }

  let token: string | null = null;

  // Try Authorization header first
  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  // If no header token, try URL parameter
  if (!token) {
    const { searchParams } = new URL(request.url);
    token = searchParams.get('token');
  }

  // No token found in either location
  if (!token) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { error: 'Missing authentication. Provide Authorization header or token parameter.' },
        { status: 401 }
      ),
    };
  }

  // Token doesn't match
  if (token !== apiKey) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      ),
    };
  }

  return { authenticated: true };
}
