const http = require('http');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { assessIssue, forecast } = require('../ai/engine');
const { sensorCatalog, sampleReadings } = require('../iot/simulator');

const PORT = Number(process.env.PORT || 3000);
const frontendRoot = path.join(__dirname, '..', 'frontend');
const sensorReadings = sampleReadings();
const reports = [
  { id: randomUUID(), description: 'Large pothole near the school entrance', location: 'Kalyan Nagar', status: 'assigned', createdAt: new Date(Date.now() - 3600000).toISOString(), ...assessIssue({ description: 'Large pothole near the school entrance', source: 'citizen' }) },
  { id: randomUUID(), description: 'Water level rising on the market road', location: 'Market Circle', status: 'new', createdAt: new Date(Date.now() - 7200000).toISOString(), ...assessIssue({ description: 'Water level rising on the market road', source: 'iot', sensorRisk: 1 }) },
  { id: randomUUID(), description: 'Garbage container overflowing', location: 'Old Town', status: 'in_progress', createdAt: new Date(Date.now() - 10800000).toISOString(), ...assessIssue({ description: 'Garbage container overflowing', source: 'citizen' }) }
];

function json(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  response.end(JSON.stringify(body));
}
function body(request) {
  return new Promise((resolve, reject) => { let data = ''; request.on('data', (chunk) => { data += chunk; }); request.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch (error) { reject(error); } }); });
}
function overview() {
  const counts = reports.reduce((result, report) => { result[report.priority] = (result[report.priority] || 0) + 1; return result; }, {});
  return { totalReports: reports.length, openReports: reports.filter((report) => report.status !== 'resolved').length, criticalReports: counts.critical || 0, resolvedToday: reports.filter((report) => report.status === 'resolved').length, priorityCounts: counts, forecast: forecast(sensorReadings), zones: [...new Set(reports.map((report) => report.location))].length };
}
function serveFile(request, response) {
  const requested = request.url === '/' ? 'index.html' : request.url.slice(1);
  const filePath = path.normalize(path.join(frontendRoot, requested));
  if (!filePath.startsWith(frontendRoot)) return json(response, 403, { error: 'Forbidden' });
  fs.readFile(filePath, (error, content) => { if (error) return json(response, 404, { error: 'Not found' }); const type = filePath.endsWith('.css') ? 'text/css' : filePath.endsWith('.js') ? 'text/javascript' : 'text/html'; response.writeHead(200, { 'Content-Type': type }); response.end(content); });
}
const server = http.createServer(async (request, response) => {
  if (request.method === 'OPTIONS') { response.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' }); return response.end(); }
  const url = new URL(request.url, `http://${request.headers.host}`);
  try {
    if (url.pathname === '/api/overview') return json(response, 200, overview());
    if (url.pathname === '/api/reports' && request.method === 'GET') return json(response, 200, reports.sort((a, b) => b.urgency - a.urgency));
    if (url.pathname === '/api/sensors' && request.method === 'GET') return json(response, 200, sensorReadings);
    if (url.pathname === '/api/reports' && request.method === 'POST') {
      const input = await body(request);
      if (!input.description || !input.location) return json(response, 400, { error: 'description and location are required' });
      const assessment = assessIssue(input);
      const report = { id: randomUUID(), description: input.description, location: input.location, status: 'new', createdAt: new Date().toISOString(), ...assessment };
      reports.push(report);
      return json(response, 201, report);
    }
    if (url.pathname === '/api/health') return json(response, 200, { status: 'ok', service: 'nagarkon' });
    return serveFile(request, response);
  } catch (error) { return json(response, 500, { error: error.message }); }
});

if (require.main === module) server.listen(PORT, () => console.log(`NagarKon running at http://localhost:${PORT}`));
module.exports = { server, reports, sensorReadings, overview };
