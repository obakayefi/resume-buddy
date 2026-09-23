
async function checkOllama() {
  const urls = ['http://127.0.0.1:11434/api/tags', 'http://localhost:11434/api/tags'];
  
  for (const url of urls) {
    console.log(`Checking ${url}...`);
    try {
      const start = Date.now();
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      const duration = Date.now() - start;
      console.log(`  ${url}: ${res.status} ${res.statusText} (${duration}ms)`);
    } catch (e) {
      console.log(`  ${url}: Error: ${e.message}`);
    }
  }
}

checkOllama();
