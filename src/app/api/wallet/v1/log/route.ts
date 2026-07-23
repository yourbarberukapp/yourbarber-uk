import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (Array.isArray(body.logs)) {
    for (const line of body.logs) console.warn('[PassKit device log]', line);
  }
  return NextResponse.json({}, { status: 200 });
}
