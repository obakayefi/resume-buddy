import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const resume = await prisma.masterResume.findUnique({ where: { id } });
    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }
    const safeParse = (str: string) => {
      try {
        if (!str) return [];
        return JSON.parse(str);
      } catch (e) {
        return [];
      }
    };

    return NextResponse.json({
      ...resume,
      skills: safeParse(resume.skills),
      skillGroups: safeParse(resume.skillGroups),
      experience: safeParse(resume.experience),
      education: safeParse(resume.education),
      projects: safeParse(resume.projects),
      certifications: safeParse(resume.certifications),
    });
  } catch (error) {
    console.error('Error fetching resume:', error);
    return NextResponse.json({ error: 'Failed to fetch resume' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const resume = await prisma.masterResume.update({
      where: { id },
      data: {
        name: body.name,
        title: body.title,
        email: body.email,
        phone: body.phone,
        location: body.location,
        linkedin: body.linkedin,
        twitter: body.twitter,
        website: body.website,
        summary: body.summary,
        skills: JSON.stringify(body.skills || []),
        skillGroups: JSON.stringify(body.skillGroups || []),
        experience: JSON.stringify(body.experience || []),
        education: JSON.stringify(body.education || []),
        projects: JSON.stringify(body.projects || []),
        certifications: JSON.stringify(body.certifications || []),
      },
    });
    const safeParse = (str: string) => {
      try {
        if (!str) return [];
        return JSON.parse(str);
      } catch (e) {
        return [];
      }
    };

    return NextResponse.json({
      ...resume,
      skills: safeParse(resume.skills),
      skillGroups: safeParse(resume.skillGroups),
      experience: safeParse(resume.experience),
      education: safeParse(resume.education),
      projects: safeParse(resume.projects),
      certifications: safeParse(resume.certifications),
    });
  } catch (error) {
    console.error('Error updating resume:', error);
    return NextResponse.json({ error: 'Failed to update resume' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.masterResume.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting resume:', error);
    return NextResponse.json({ error: 'Failed to delete resume' }, { status: 500 });
  }
}
