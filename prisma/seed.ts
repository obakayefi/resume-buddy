import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  const resume = await prisma.masterResume.create({
    data: {
      name: 'John Doe',
      title: 'Senior Software Engineer',
      email: 'john.doe@example.com',
      phone: '555-0123',
      location: 'San Francisco, CA',
      linkedin: 'linkedin.com/in/johndoe',
      website: 'johndoe.dev',
      summary: 'Experienced Software Engineer with a passion for building scalable web applications and AI-driven solutions. Expert in React, Node.js, and Cloud Architecture.',
      skills: JSON.stringify(['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker', 'AWS', 'Python']),
      experience: JSON.stringify([
        {
          id: 'exp1',
          company: 'TechCorp Solutions',
          title: 'Senior Engineer',
          startDate: 'Jan 2020',
          endDate: 'Present',
          bullets: [
            'Led a team of 5 developers to build a real-time analytics dashboard used by 10k+ clients.',
            'Optimized database queries reducing latency by 40%.',
            'Implemented automated CI/CD pipelines using GitHub Actions.',
          ],
        },
        {
          id: 'exp2',
          company: 'StartUp Inc.',
          title: 'Full Stack Developer',
          startDate: 'Jun 2017',
          endDate: 'Dec 2019',
          bullets: [
            'Developed the core product feature that increased user retention by 25%.',
            'Integrated third-party APIs for payment processing and notification systems.',
          ],
        },
      ]),
      education: JSON.stringify([
        {
          id: 'edu1',
          school: 'University of Technology',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          startDate: '2013',
          endDate: '2017',
        },
      ]),
    },
  });

  await prisma.settings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      ollamaModel: 'llama3',
      ollamaBaseUrl: 'http://localhost:11434',
    },
  });

  console.log('Seeding finished. Created resume ID:', resume.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
