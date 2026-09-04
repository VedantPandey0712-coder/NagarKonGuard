const assert = require('assert');
const { server } = require('../backend/server');

server.listen(0, async () => {
  const port = server.address().port;
  const request = (url, options) => fetch(`http://127.0.0.1:${port}${url}`, options).then(async (response) => ({ status: response.status, body: await response.json() }));
  try {
    const health = await request('/api/health');
    assert.equal(health.body.status, 'ok');
    const created = await request('/api/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description: 'Flooding reported beside the bridge', location: 'River Ward', source: 'citizen' }) });
    assert.equal(created.status, 201);
    assert.equal(created.body.priority, 'critical');
    assert.ok(created.body.predictedResponseBy);
    const overview = await request('/api/overview');
    assert.ok(overview.body.forecast.floodRisk >= 0);
    const page = await fetch(`http://127.0.0.1:${port}/`);
    assert.equal(page.status, 200);
    console.log('Smoke test passed: health, AI assessment, forecast, and dashboard all respond.');
  } finally { server.close(); }
});
