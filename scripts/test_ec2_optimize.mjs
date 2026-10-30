async function test() {
  console.log('Testing optimized prompt with num_predict and concise context...');
  const t0 = Date.now();
  const prompt = `RESUME:
Emmanuel Giwa - Senior Software Engineer (6+ yrs) | React, Next.js, TypeScript, Node.js, AWS.
JD:
Senior Frontend Engineer at DotLabs. React, Next.js, TypeScript, frontend latency optimization.

TASK: Return ONLY valid JSON:
{"optimizedSummary": "summary string...", "bullets": [{"original": "built app", "optimized": "Architected Next.js app with TypeScript, reducing latency by 30%.", "relevance": "high"}]}`;

  const res = await fetch('https://3.88.72.65.sslip.io/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2:3b',
      prompt,
      stream: false,
      format: 'json',
      options: { temperature: 0.3, num_ctx: 2048, num_predict: 350 },
    }),
  });
  console.log('Status:', res.status, 'Time taken:', (Date.now() - t0) + 'ms');
  const text = await res.text();
  console.log('Response:', text.slice(0, 300));
}

test();
