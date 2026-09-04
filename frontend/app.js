const $ = (selector) => document.querySelector(selector);
const formatTime = (value) => new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
async function loadDashboard() {
  const [overview, reports, sensors] = await Promise.all(['/api/overview', '/api/reports', '/api/sensors'].map((url) => fetch(url).then((response) => response.json())));
  $('#open-reports').textContent = overview.openReports;
  $('#critical-reports').textContent = overview.criticalReports;
  $('#resolved-today').textContent = overview.resolvedToday;
  $('#flood-risk').textContent = `${overview.forecast.floodRisk}%`;
  $('#forecast-horizon').textContent = overview.forecast.horizon;
  $('#report-count').textContent = `${overview.totalReports} total`;
  $('#report-list').innerHTML = reports.map((report) => `<article class="report"><span class="priority-bar ${report.priority}"></span><div><p class="report-title">${report.description}</p><div class="report-meta"><b>${report.category}</b> · ${report.location} · ${formatTime(report.createdAt)} · ${report.status.replace('_', ' ')}</div></div><span class="badge ${report.priority}">${report.priority}</span></article>`).join('');
  $('#sensor-list').innerHTML = sensors.map((sensor) => `<div class="sensor"><div class="sensor-name">${sensor.id}<small>${sensor.zone} · ${sensor.metric.replace('_', ' ')}</small></div><div class="sensor-value">${sensor.value}<small>${sensor.unit} <span class="status ${sensor.status}">${sensor.status}</span></small></div></div>`).join('');
}
$('#new-report').addEventListener('click', () => $('#report-dialog').showModal());
$('#report-form').addEventListener('submit', async (event) => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)); const response = await fetch('/api/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (!response.ok) return; event.currentTarget.reset(); $('#report-dialog').close(); await loadDashboard(); });
loadDashboard().catch(() => { $('#report-list').innerHTML = '<div class="loading">Unable to reach city systems.</div>'; });
