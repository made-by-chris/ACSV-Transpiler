import express from 'express';
import transpile from 'acsv-transpiler';

const app = express();
app.use(express.text({ type: '*/*' }));
app.use(express.json());

// In-memory latest browser test result
let lastResult = null;

// Serve built library from parent project dist/ for the browser test
app.use('/lib', express.static('../dist'));

// Serve static browser test page
app.use(express.static('public'));

app.get('/node-test', (req, res) => {
  const input = 'id,name\n\n' + 'id++,name=John Doe\n' + ',,,\n';
  const csv = transpile({ input, streaming: false, stats: false });
  res.type('text/plain').send(csv);
});

app.post('/api/transpile', (req, res) => {
  const input = req.body || '';
  try {
    const csv = transpile({ input, streaming: false, stats: false });
    res.type('text/plain').send(csv);
  } catch (e) {
    res.status(400).json({ error: String(e) });
  }
});

// Endpoint for automated browser test to report results
app.post('/report', (req, res) => {
  const body = req.body || {};
  const input = body.input || '';
  const browserCsv = body.csv || '';
  const error = body.error || null;
  let serverCsv = '';
  let match = false;
  try {
    if (!error) {
      serverCsv = transpile({ input, streaming: false, stats: false });
      match = serverCsv === browserCsv;
    }
  } catch (e) {
    lastResult = { ok: false, error: String(e), input, browserCsv, serverCsv, match: false };
    return res.json(lastResult);
  }
  lastResult = { ok: !error && match, error, input, browserCsv, serverCsv, match };
  res.json(lastResult);
});

// Read latest result (polled by headless test)
app.get('/last-result', (req, res) => {
  res.json(lastResult || { ok: false, pending: true });
});

// Reset last result
app.post('/reset', (req, res) => {
  lastResult = null;
  res.json({ ok: true });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`dummy-consumer listening on http://localhost:${port}`));
