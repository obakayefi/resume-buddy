import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const resumes = await prisma.masterResume.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    const safeParse = (str: string) => {
      try {
        if (!str) return [];
        return JSON.parse(str);
      } catch (e) {
        return [];
      }
    };

    const parsed = resumes.map((r) => ({
      ...r,
      skills: safeParse(r.skills),
      skillGroups: safeParse(r.skillGroups),
      experience: safeParse(r.experience),
      education: safeParse(r.education),
      projects: safeParse(r.projects),
      certifications: safeParse(r.certifications),
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Error fetching resumes:', error);
    return NextResponse.json({ error: 'Failed to fetch resumes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const resume = await prisma.masterResume.create({
      data: {
        name: body.name || '',
        title: body.title || '',
        email: body.email || '',
        phone: body.phone || '',
        location: body.location || '',
        linkedin: body.linkedin || '',
        twitter: body.twitter || '',
        website: body.website || '',
        summary: body.summary || '',
        skills: JSON.stringify(body.skills || []),
        skillGroups: JSON.stringify(body.skillGroups || []),
        experience: JSON.stringify(body.experience || []),
        education: JSON.stringify(body.education || []),
        projects: JSON.stringify(body.projects || []),
        certifications: JSON.stringify(body.certifications || []),
      },
    });

    return NextResponse.json({
      ...resume,
      skills: JSON.parse(resume.skills),
      skillGroups: JSON.parse(resume.skillGroups),
      experience: JSON.parse(resume.experience),
      education: JSON.parse(resume.education),
      projects: JSON.parse(resume.projects),
      certifications: JSON.parse(resume.certifications),
    });
  } catch (error) {
    console.error('Error creating resume:', error);
    return NextResponse.json({ error: 'Failed to create resume' }, { status: 500 });
  }
}
