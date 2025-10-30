import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer';

const PORT = process.env.PORT || 4010;

function waitForLine(child, substring, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const to = setTimeout(() => reject(new Error('Timeout waiting for server start')), timeoutMs);
    function onData(buf) {
      const s = String(buf);
      if (s.includes(substring)) { clearTimeout(to); child.stdout.off('data', onData); resolve(); }
    }
    child.stdout.on('data', onData);
  });
}

async function waitForResult(url, timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(url);
    const json = await res.json();
    if (!json.pending) return json;
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error('Timeout waiting for last-result');
}

async function main() {
  // Start server with test port
  const server = spawn(process.execPath, ['server.mjs'], { env: { ...process.env, PORT: String(PORT) } });
  server.stdout.setEncoding('utf8');
  server.stderr.setEncoding('utf8');
  server.stderr.on('data', d => process.stderr.write(d));
  await waitForLine(server, `http://localhost:${PORT}`);

  // Reset last result
  await fetch(`http://localhost:${PORT}/reset`, { method: 'POST' });

  // Launch headless browser
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(`http://localhost:${PORT}/?autotest=1`);

  // Wait for /last-result
  const result = await waitForResult(`http://localhost:${PORT}/last-result`);

  await browser.close();
  server.kill('SIGTERM');

  if (!result.ok || !result.match) {
    console.error('Web test failed:', result);
    process.exit(1);
  }
  console.log('Web test passed');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
