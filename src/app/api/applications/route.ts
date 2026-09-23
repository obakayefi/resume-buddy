import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const applications = await prisma.application.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const application = await prisma.application.create({
      data: {
        company: body.company,
        jobTitle: body.jobTitle,
        jobUrl: body.jobUrl || '',
        salary: body.salary || '',
        location: body.location || '',
        jobDescription: body.jobDescription,
        extraInfo: body.extraInfo || '',
        status: body.status || 'saved',
        atsScore: body.atsScore || 0,
        optimizedResume: body.optimizedResume || '',
        optimizedSummary: body.optimizedSummary || '',
        coverLetter: body.coverLetter || '',
        linkedinMessage: body.linkedinMessage || '',
        recruiterName: body.recruiterName || '',
        recruiterLinkedin: body.recruiterLinkedin || '',
        notes: body.notes || '',
        masterResumeId: body.masterResumeId,
        generationTimes: body.generationTimes || '{}',
        appliedAt: body.appliedAt ? new Date(body.appliedAt) : null,
      },
    });
    return NextResponse.json(application);
  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
  }
}
