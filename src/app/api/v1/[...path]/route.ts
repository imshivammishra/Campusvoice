import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/server/db';
import { createContext, errorResponse, json } from '@/lib/server/http';
import { handleAuth } from '@/lib/server/routes/auth-routes';
import { handleUsers } from '@/lib/server/routes/user-routes';
import { handleOrg } from '@/lib/server/routes/org-routes';
import { handleElections } from '@/lib/server/routes/election-routes';
import { handleProposals } from '@/lib/server/routes/proposal-routes';
import { handleCommunication } from '@/lib/server/routes/communication-routes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: { path: string[] } };

async function dispatch(request: NextRequest, context: Context) {
  const segments = context.params.path || [];

  if (segments[0] === 'health') {
    return json({
      status: 'ok',
      service: 'campusvoice',
      database: Boolean(process.env.MONGODB_URI),
      timestamp: new Date().toISOString(),
    });
  }

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204 });
  }

  try {
    await connectDB();
  } catch (error: any) {
    return json(
      {
        message:
          'The database is not reachable. Set MONGODB_URI in .env.local and try again.',
        detail: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      503,
    );
  }

  const ctx = createContext(request, segments);

  try {
    const handlers = [handleAuth, handleUsers, handleOrg, handleElections, handleProposals, handleCommunication];
    for (const handler of handlers) {
      const response = await handler(ctx);
      if (response) return response;
    }
    return json(
      {
        message: `API route not found: ${request.method} /api/v1/${segments.join('/')}`,
      },
      404,
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(request: NextRequest, context: Context) {
  return dispatch(request, context);
}

export async function POST(request: NextRequest, context: Context) {
  return dispatch(request, context);
}

export async function PUT(request: NextRequest, context: Context) {
  return dispatch(request, context);
}

export async function PATCH(request: NextRequest, context: Context) {
  return dispatch(request, context);
}

export async function DELETE(request: NextRequest, context: Context) {
  return dispatch(request, context);
}

export async function OPTIONS(request: NextRequest, context: Context) {
  return dispatch(request, context);
}
