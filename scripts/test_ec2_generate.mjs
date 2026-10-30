async function test() {
  console.log('Sending short test request to EC2 Ollama...');
  const t0 = Date.now();
  const res = await fetch('https://3.88.72.65.sslip.io/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2:3b',
      prompt: 'Hello! Respond with "OK" in JSON format: {"status": "OK"}',
      stream: false,
      format: 'json',
    }),
  });
  console.log('Status:', res.status, 'Time taken:', (Date.now() - t0) + 'ms');
  const text = await res.text();
  console.log('Response body:', text);
}

test().catch(console.error);
