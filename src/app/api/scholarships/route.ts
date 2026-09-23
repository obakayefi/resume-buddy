import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const scholarships = await prisma.scholarship.findMany({
      include: {
        questions: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(scholarships);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, organization, track, url, awardAmount, deadline, status, notes, questions } = body;

    if (!name || !organization) {
      return NextResponse.json({ error: 'Name and organization are required' }, { status: 400 });
    }

    const scholarship = await prisma.scholarship.create({
      data: {
        name,
        organization,
        track: track || 'General',
        url: url || '',
        awardAmount: awardAmount || '',
        deadline: deadline || '',
        status: status || 'saved',
        notes: notes || '',
        questions: {
          create: (questions || []).map((q: any) => ({
            prompt: q.prompt,
            maxWords: q.maxWords ? parseInt(q.maxWords) : 300,
            maxChars: q.maxChars ? parseInt(q.maxChars) : 0,
            answer: q.answer || '',
            status: q.status || 'todo',
          })),
        },
      },
      include: {
        questions: true,
      },
    });

    return NextResponse.json(scholarship, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
