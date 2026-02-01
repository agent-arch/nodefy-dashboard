import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Check for static data file first
  const staticPath = path.join(process.cwd(), 'public/data/workspace.json');
  
  if (fs.existsSync(staticPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(staticPath, 'utf-8'));
      return NextResponse.json({ 
        sessions: data.sessions || [],
        count: (data.sessions || []).length,
        generatedAt: data.generatedAt,
        source: 'static'
      });
    } catch (e) {
      console.error('Error reading static data:', e);
    }
  }

  // Fall back to live Moltbot API (local development)
  const MOLTBOT_URL = process.env.MOLTBOT_URL || 'http://localhost:18789';
  
  try {
    const res = await fetch(`${MOLTBOT_URL}/api/sessions?limit=50&messageLimit=0`, {
      cache: 'no-store',
    });
    
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ ...data, source: 'live' });
    }
  } catch (error) {
    console.log('Could not connect to Moltbot API:', error);
  }

  return NextResponse.json({
    count: 0,
    sessions: [],
    source: 'fallback',
    note: 'No data available',
  });
}
