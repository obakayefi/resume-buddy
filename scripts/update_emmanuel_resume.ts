import { prisma } from '../src/lib/db';

async function main() {
  const existing = await prisma.masterResume.findFirst({
    where: { name: { contains: 'Emmanuel' } },
  });

  if (!existing) {
    console.log('Emmanuel Giwa resume not found');
    return;
  }

  const updated = await prisma.masterResume.update({
    where: { id: existing.id },
    data: {
      name: 'Emmanuel Giwa',
      title: 'SOFTWARE ENGINEER (6+ YEARS)',
      email: 'iamtundegiwa@gmail.com',
      phone: '+2349049715806',
      location: 'Enugu, Nigeria',
      linkedin: 'https://linkedin.com/in/iamtundegiwa',
      twitter: 'https://x.com/iamtundegiwa',
      website: 'https://seniorbarman.com',
      summary:
        'High-impact Senior Software Engineer & Technical Lead with 6+ years of experience architecting distributed, mission-critical systems and modern full-stack web applications. Expert across React, Next.js, TypeScript, cloud microservices, and AI-driven platforms, with a proven track record of reducing API latency by 30%, boosting user engagement by 20%, and mentoring high-velocity engineering teams to deliver robust business value.',
      skills: JSON.stringify([]),
      skillGroups: JSON.stringify([
        {
          id: 'sk-lang',
          category: 'Languages',
          skills: ['JavaScript', 'TypeScript', 'Python', 'C', 'C#'],
        },
        {
          id: 'sk-front',
          category: 'Frontend',
          skills: ['ReactJS', 'NextJS', 'VueJS', 'Redux', 'Tailwind CSS', 'UI/UX Collaboration'],
        },
        {
          id: 'sk-back',
          category: 'Backend',
          skills: ['Node.js', 'Express.js', '.NET', 'RESTful APIs', 'GraphQL'],
        },
        {
          id: 'sk-db',
          category: 'Databases',
          skills: ['PostgreSQL', 'MongoDB', 'Firebase'],
        },
        {
          id: 'sk-cloud',
          category: 'Cloud/Tools',
          skills: ['AWS', 'GCP', 'Docker', 'CI/CD', 'Git', 'ElasticSearch', 'Firebase'],
        },
        {
          id: 'sk-meth',
          category: 'Methodologies',
          skills: ['Agile', 'Scrum', 'Mentoring', 'Code Reviews'],
        },
      ]),
      experience: JSON.stringify([
        {
          id: 'exp-ai3',
          company: 'AI3 - London, United Kingdom',
          title: 'Senior Software Engineer (Contract)',
          startDate: 'Apr 2025',
          endDate: 'Feb 2026',
          bullets: [
            'Architected and engineered "AI3 Teams," a modular internal communication platform leveraging LLMs for scoped, context-aware team collaboration while ensuring strict data isolation between departments.',
            'Engineered and deployed an ERC-20 governance token and customized DAO smart contracts, establishing the foundation for decentralized protocol treasury and community-led decision-making.',
            'Developed a high-performance web interface using Next.js, integrating complex AI-streaming features and real-time state management for a seamless "chat-to-action" user experience.',
            'Designed a modular permissioning system that programmatically restricted LLM access to sensitive internal data, ensuring enterprise-grade security and conversational privacy.',
          ],
        },
        {
          id: 'exp-dash360',
          company: 'Dash360 - Texas, USA',
          title: 'Full-Stack Engineer',
          startDate: 'Jan 2023',
          endDate: 'Apr 2025',
          bullets: [
            'Architected and released key feature enhancements on a project management platform, improving user engagement by 15% via enhanced Gantt chart, and scheduling UX components.',
            'Built dynamic data grids and interactive tree structures, enabling better project visibility and increasing platform adoption by 20%.',
            'Reduced backend API latency by 30% through performance optimization and collaborated with QA to ensure robustness across updates.',
          ],
        },
        {
          id: 'exp-glade',
          company: 'Glade Finances - Lagos, Nigeria',
          title: 'Lead Frontend Engineer',
          startDate: 'Apr 2021',
          endDate: 'Apr 2023',
          bullets: [
            'Delivered a responsive financial dashboard that accelerated user transactions speed by 25%, increasing mobile retention.',
            'Led mentorship programs for junior developers, boosting team productivity by 35% and enhancing code quality.',
            'Implemented cutting-edge frontend optimizations that reduced initial load times by 40%.',
          ],
        },
        {
          id: 'exp-prime',
          company: 'Primeclick Media - Lagos, Nigeria',
          title: 'Lead Frontend Engineer',
          startDate: 'Nov 2018',
          endDate: 'Dec 2020',
          bullets: [
            'Directed engineering efforts on client websites and applications, achieving 90% client retention.',
            'Collaborated cross-functionally to deliver projects ahead of schedule, improving customer satisfaction.',
            'Spearheaded client onboarding and technical requirement gathering, optimizing development pipelines.',
          ],
        },
      ]),
      projects: JSON.stringify([
        {
          id: 'proj-mms',
          name: 'Mentor Management System',
          description:
            'Automated tracking for Andela cohorts, improving mentor engagement and program feedback.',
        },
        {
          id: 'proj-sb',
          name: 'Seniorbarman (seniorbarman.com)',
          url: 'https://seniorbarman.com',
          description:
            'Built an event ticketing platform used by the Enugu Rangers Football Club for their home matches and local events within the state. I developed the entire system, including a simple mobile scanner for bouncers to check fans in at the gate and a detailed data dashboard for club managers to track ticket sales and attendance in real-time. This project helped the club move from paper tickets to a fully digital system, making match days much faster and more organized.',
        },
      ]),
      education: JSON.stringify([
        {
          id: 'edu-miva',
          school: 'Miva University – Abuja, Nigeria',
          degree: 'Bsc in Computer Science',
          field: '',
          startDate: '',
          endDate: '2024',
        },
      ]),
      certifications: JSON.stringify([
        {
          id: 'cert-react',
          name: 'Frontend Engineering with React',
          issuer: 'Venture Garden Group',
        },
        {
          id: 'cert-gcp',
          name: 'Google Cloud Associate Cloud Engineer',
          issuer: 'Google Developer Scholarship',
        },
        {
          id: 'cert-unity',
          name: 'Unity Game Development',
          issuer: 'Maliyo Games',
        },
      ]),
    },
  });

  console.log('Successfully updated resume ID:', updated.id, updated.name);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
