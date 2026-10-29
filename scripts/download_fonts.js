const https = require('https');
const fs = require('fs');
const path = require('path');

function get(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(get(res.headers.location, headers));
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({ buffer: Buffer.concat(chunks), text: Buffer.concat(chunks).toString('utf8'), headers: res.headers }));
      res.on('error', reject);
    });
  });
}

async function downloadFont(weight, filename) {
  const cssRes = await get('https://fonts.googleapis.com/css?family=Inter:' + weight, {
    'User-Agent': 'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)'
  });
  const match = cssRes.text.match(/url\((https:\/\/[^)]+)\)/);
  if (!match) {
    throw new Error('Could not find TTF url for weight ' + weight);
  }
  const fontUrl = match[1].replace(/['"]/g, '');
  console.log('Downloading weight ' + weight + ' from ' + fontUrl);
  const fontRes = await get(fontUrl);
  const dest = path.join(process.cwd(), 'public', 'fonts', filename);
  fs.writeFileSync(dest, fontRes.buffer);
  console.log('Saved to ' + dest + ' (size: ' + fontRes.buffer.length + ' bytes)');
}

async function main() {
  const dir = path.join(process.cwd(), 'public', 'fonts');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  await downloadFont(400, 'Inter-Regular.ttf');
  await downloadFont(700, 'Inter-Bold.ttf');
  console.log('Done downloading Inter fonts!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
