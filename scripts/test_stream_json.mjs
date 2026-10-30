async function test() {
  console.log('Testing streaming JSON response from EC2 Ollama...');
  const t0 = Date.now();
  const res = await fetch('https://3.88.72.65.sslip.io/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2:3b',
      prompt: 'Return a JSON object with keys "summary" and "skills" (array of 3 skills) for a frontend developer. Return ONLY valid JSON.',
      stream: true,
      format: 'json',
      options: { temperature: 0.3, num_ctx: 2048, num_predict: 300 },
    }),
  });

  console.log('Initial response status:', res.status, 'TTFB:', (Date.now() - t0) + 'ms');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let chunkCount = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunkCount++;
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.response) fullText += parsed.response;
      } catch (e) {}
    }
  }

  console.log('Stream ended in:', (Date.now() - t0) + 'ms. Chunks received:', chunkCount);
  console.log('Full JSON text:');
  console.log(fullText);

  const jsonMatch = fullText.match(/\{[\s\S]*\}/);
  const parsedJson = JSON.parse(jsonMatch ? jsonMatch[0] : fullText);
  console.log('Successfully parsed final JSON:', parsedJson);
}

test().catch(console.error);
