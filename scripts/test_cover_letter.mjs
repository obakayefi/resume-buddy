async function test() {
  const payload = {
    resume: `Emmanuel Giwa
SOFTWARE ENGINEER (6+ YEARS)
Enugu, Nigeria | +2349049715806 | iamtundegiwa@gmail.com
LINKEDIN | X | PORTFOLIO WEBSITE
Professional Summary: High-impact Senior Software Engineer & Technical Lead with 6+ years of experience architecting distributed, mission-critical systems and modern full-stack web applications.
Experience:
Senior Software Engineer at AI3: Architected AI3 Teams internal communication platform leveraging LLMs for scoped, context-aware collaboration. Developed Next.js web interface with real-time state management.
Full-Stack Engineer at Dash360: Reduced backend API latency by 30% through performance optimization. Built dynamic data grids and interactive tree structures.
Lead Frontend Engineer at Glade Finances: Accelerated user transaction speed by 25%. Mentored junior developers boosting productivity by 35%.`,
    jobDescription: `DotLabs is seeking a Senior Frontend Engineer with deep expertise in React, TypeScript, and high-performance customer-facing web applications. You will tackle frontend latency bottlenecks, build reusable UI component libraries, and collaborate with backend engineers on REST/GraphQL APIs in an async, distributed team.`,
    company: 'DotLabs',
    jobTitle: 'Senior Frontend Engineer',
    candidateName: 'Emmanuel Giwa',
    candidateEmail: 'iamtundegiwa@gmail.com',
    candidatePhone: '+2349049715806',
    candidateLocation: 'Enugu, Nigeria',
    candidateWebsite: 'https://seniorbarman.com',
    candidateLinkedin: 'https://linkedin.com/in/iamtundegiwa',
    action: 'cover-letter',
    model: 'llama3.2:3b',
  };

  const res = await fetch('http://localhost:3000/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.error('Error status:', res.status, await res.text());
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let result = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value);
  }

  console.log('--- GENERATED COVER LETTER ---');
  console.log(result);
  console.log('------------------------------');
}

test().catch(console.error);
