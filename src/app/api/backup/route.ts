import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const [resumes, applications, stories, scholarships, settings] = await Promise.all([
      prisma.masterResume.findMany(),
      prisma.application.findMany(),
      prisma.storyBankItem.findMany(),
      prisma.scholarship.findMany({
        include: { questions: true },
      }),
      prisma.settings.findFirst(),
    ]);

    const backupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      appName: 'Applikator',
      stats: {
        resumes: resumes.length,
        applications: applications.length,
        storyBank: stories.length,
        scholarships: scholarships.length,
      },
      data: {
        resumes,
        applications,
        storyBank: stories,
        scholarships,
        settings,
      },
    };

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="applikator-workspace-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error: any) {
    console.error('Backup export failed:', error);
    return NextResponse.json({ error: error.message || 'Export failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const data = payload?.data || payload;

    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Invalid backup file format' }, { status: 400 });
    }

    const { resumes = [], applications = [], storyBank = [], scholarships = [], settings } = data;

    let restoredResumes = 0;
    let restoredApps = 0;
    let restoredStories = 0;
    let restoredScholarships = 0;

    // 1. Resumes
    for (const r of resumes) {
      if (!r.id || !r.name) continue;
      const { id, createdAt, updatedAt, applications: _apps, ...rest } = r;
      await prisma.masterResume.upsert({
        where: { id },
        create: { id, ...rest },
        update: rest,
      });
      restoredResumes++;
    }

    // 2. Applications
    for (const a of applications) {
      if (!a.id || !a.company || !a.masterResumeId) continue;
      const { id, createdAt, updatedAt, masterResume: _mr, ...rest } = a;
      // ensure master resume exists before inserting application
      const resumeExists = await prisma.masterResume.findUnique({ where: { id: rest.masterResumeId } });
      if (!resumeExists) continue;

      await prisma.application.upsert({
        where: { id },
        create: { id, ...rest },
        update: rest,
      });
      restoredApps++;
    }

    // 3. Story Bank
    for (const s of storyBank) {
      if (!s.id || !s.title) continue;
      const { id, createdAt, updatedAt, ...rest } = s;
      await prisma.storyBankItem.upsert({
        where: { id },
        create: { id, ...rest },
        update: rest,
      });
      restoredStories++;
    }

    // 4. Scholarships & Questions
    for (const sc of scholarships) {
      if (!sc.id || !sc.name) continue;
      const { id, createdAt, updatedAt, questions = [], ...rest } = sc;
      await prisma.scholarship.upsert({
        where: { id },
        create: { id, ...rest },
        update: rest,
      });

      for (const q of questions) {
        if (!q.id || !q.prompt) continue;
        const { id: qId, createdAt: _qC, updatedAt: _qU, ...qRest } = q;
        await prisma.scholarshipQuestion.upsert({
          where: { id: qId },
          create: { id: qId, scholarshipId: id, ...qRest },
          update: qRest,
        });
      }
      restoredScholarships++;
    }

    // 5. Settings
    if (settings) {
      const { id = 'default', ollamaModel, ollamaBaseUrl, actionConfig } = settings;
      await prisma.settings.upsert({
        where: { id },
        create: { id, ollamaModel, ollamaBaseUrl, actionConfig },
        update: { ollamaModel, ollamaBaseUrl, actionConfig },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Workspace restored successfully',
      counts: {
        resumes: restoredResumes,
        applications: restoredApps,
        storyBank: restoredStories,
        scholarships: restoredScholarships,
      },
    });
  } catch (error: any) {
    console.error('Backup restore failed:', error);
    return NextResponse.json({ error: error.message || 'Restore failed' }, { status: 500 });
  }
}
