import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const baseUrl = searchParams.get('baseUrl') || 'http://127.0.0.1:11434';

  try {
    const res = await fetch(`${baseUrl}/api/tags`);
    if (res.ok) {
      const data = await res.json();
      const models = data.models?.map((m: { name: string }) => m.name) || [];
      return NextResponse.json({ connected: true, models });
    }
    return NextResponse.json({ connected: false, models: [] });
  } catch {
    return NextResponse.json({ connected: false, models: [] });
  }
}
