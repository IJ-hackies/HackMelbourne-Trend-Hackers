import { NextResponse } from 'next/server';

let latestSync: Record<string, unknown> | null = null;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    latestSync = body;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }
}

export async function GET() {
  if (!latestSync) {
    return NextResponse.json({ exists: false }, { status: 404 });
  }
  return NextResponse.json({ exists: true, data: latestSync });
}
