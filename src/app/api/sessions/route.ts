import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface Session {
  key: string;
  kind: string;
  channel: string;
  displayName?: string;
  model?: string;
  totalTokens?: number;
  updatedAt: number;
  sessionId: string;
}

const MOLTBOT_URL = process.env.MOLTBOT_URL || 'http://localhost:8024';
const MOLTBOT_TOKEN = process.env.MOLTBOT_TOKEN || '';

export async function GET() {
  try {
    // Try to fetch from Moltbot API if available
    if (MOLTBOT_TOKEN) {
      const res = await fetch(`${MOLTBOT_URL}/api/sessions?limit=50&messageLimit=0`, {
        headers: {
          'Authorization': `Bearer ${MOLTBOT_TOKEN}`,
        },
      });
      
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    }

    // Fallback: return mock data or empty
    return NextResponse.json({
      count: 0,
      sessions: [],
      note: 'Configure MOLTBOT_TOKEN to see live sessions',
    });
  } catch (error) {
    return NextResponse.json({ 
      error: String(error),
      note: 'Could not connect to Moltbot API',
    }, { status: 500 });
  }
}
