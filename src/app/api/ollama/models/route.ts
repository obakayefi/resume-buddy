import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Query DB directly to avoid hanging internal fetches
    const settings = await prisma.settings.findUnique({ where: { id: 'default' } });
    let ollamaBaseUrl = settings?.ollamaBaseUrl?.trim() || 'http://127.0.0.1:11434';
    
    // Ensure URL doesn't have trailing slash for consistency
    if (ollamaBaseUrl.endsWith('/')) {
      ollamaBaseUrl = ollamaBaseUrl.slice(0, -1);
    }

    const res = await fetch(`${ollamaBaseUrl}/api/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    });
    
    if (!res.ok) {
      console.error(`Ollama tags error: ${res.status} ${res.statusText}`);
      return NextResponse.json({ error: 'Failed to fetch models from Ollama' }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data.models || []);
  } catch (error) {
    console.error('Ollama check error:', error);
    return NextResponse.json({ error: 'Ollama is not responding. Make sure it is running.' }, { status: 500 });
  }
}
