import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({ where: { id: 'default' } });
    if (!settings) {
      settings = await prisma.settings.create({
        data: { id: 'default', ollamaModel: 'llama3', ollamaBaseUrl: 'http://127.0.0.1:11434', actionConfig: '{}' },
      });
    }
    return NextResponse.json({
      ...settings,
      actionConfig: JSON.parse(settings.actionConfig || '{}'),
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const actionConfigStr = body.actionConfig ? JSON.stringify(body.actionConfig) : '{}';
    const settings = await prisma.settings.upsert({
      where: { id: 'default' },
      update: {
        ollamaModel: body.ollamaModel,
        ollamaBaseUrl: body.ollamaBaseUrl,
        actionConfig: actionConfigStr,
      },
      create: {
        id: 'default',
        ollamaModel: body.ollamaModel || 'llama3',
        ollamaBaseUrl: body.ollamaBaseUrl || 'http://127.0.0.1:11434',
        actionConfig: actionConfigStr,
      },
    });
    return NextResponse.json({
      ...settings,
      actionConfig: JSON.parse(settings.actionConfig || '{}'),
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
