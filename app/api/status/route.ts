import { NextResponse } from 'next/server';
import { hasApiKey, DEFAULT_MODEL } from '@/lib/ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    apiKeyConfigured: hasApiKey(),
    model: DEFAULT_MODEL,
  });
}
