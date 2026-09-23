import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const app = await prisma.application.findUnique({ where: { id } });
    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    return NextResponse.json(app);
  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json({ error: 'Failed to fetch application' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const app = await prisma.application.update({
      where: { id },
      data: {
        ...(body.company !== undefined && { company: body.company }),
        ...(body.jobTitle !== undefined && { jobTitle: body.jobTitle }),
        ...(body.jobUrl !== undefined && { jobUrl: body.jobUrl }),
        ...(body.salary !== undefined && { salary: body.salary }),
        ...(body.location !== undefined && { location: body.location }),
        ...(body.jobDescription !== undefined && { jobDescription: body.jobDescription }),
        ...(body.extraInfo !== undefined && { extraInfo: body.extraInfo }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.atsScore !== undefined && { atsScore: body.atsScore }),
        ...(body.optimizedResume !== undefined && { optimizedResume: body.optimizedResume }),
        ...(body.optimizedSummary !== undefined && { optimizedSummary: body.optimizedSummary }),
        ...(body.coverLetter !== undefined && { coverLetter: body.coverLetter }),
        ...(body.linkedinMessage !== undefined && { linkedinMessage: body.linkedinMessage }),
        ...(body.recruiterName !== undefined && { recruiterName: body.recruiterName }),
        ...(body.recruiterLinkedin !== undefined && { recruiterLinkedin: body.recruiterLinkedin }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.generationTimes !== undefined && { generationTimes: body.generationTimes }),
        ...(body.appliedAt !== undefined && { appliedAt: body.appliedAt ? new Date(body.appliedAt) : null }),
      },
    });
    return NextResponse.json(app);
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.application.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting application:', error);
    return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 });
  }
}
