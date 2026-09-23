import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: scholarshipId } = await params;
    const body = await req.json();
    const { prompt, maxWords, maxChars, answer, status } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Question prompt is required' }, { status: 400 });
    }

    const question = await prisma.scholarshipQuestion.create({
      data: {
        scholarshipId,
        prompt,
        maxWords: maxWords ? parseInt(maxWords) : 300,
        maxChars: maxChars ? parseInt(maxChars) : 0,
        answer: answer || '',
        status: status || 'todo',
      },
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { questionId, prompt, maxWords, maxChars, answer, status } = body;

    if (!questionId) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }

    const updated = await prisma.scholarshipQuestion.update({
      where: { id: questionId },
      data: {
        ...(prompt !== undefined && { prompt }),
        ...(maxWords !== undefined && { maxWords: parseInt(maxWords) }),
        ...(maxChars !== undefined && { maxChars: parseInt(maxChars) }),
        ...(answer !== undefined && { answer }),
        ...(status !== undefined && { status }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const questionId = searchParams.get('questionId');

    if (!questionId) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }

    await prisma.scholarshipQuestion.delete({
      where: { id: questionId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
