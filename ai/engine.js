const ISSUE_PROFILES = {
  pothole: { label: 'Road damage', weight: 7, slaHours: 24 },
  garbage: { label: 'Waste overflow', weight: 6, slaHours: 12 },
  flooding: { label: 'Flood risk', weight: 10, slaHours: 6 },
  streetlight: { label: 'Street lighting', weight: 4, slaHours: 48 },
  water: { label: 'Water leak', weight: 8, slaHours: 8 },
  other: { label: 'Civic issue', weight: 3, slaHours: 72 }
};

function classify(text = '') {
  const value = text.toLowerCase();
  const match = Object.keys(ISSUE_PROFILES).find((type) =>
    type !== 'other' && value.includes(type)
  );
  return match || (value.includes('trash') || value.includes('waste') ? 'garbage' : 'other');
}

function assessIssue({ description = '', source = 'citizen', sensorRisk = 0 }) {
  const type = classify(description);
  const profile = ISSUE_PROFILES[type];
  const urgency = Math.min(10, Math.max(1, Math.round(profile.weight + sensorRisk * 2)));
  const confidence = type === 'other' ? 0.61 : 0.9;
  const priority = urgency >= 8 ? 'critical' : urgency >= 6 ? 'high' : urgency >= 4 ? 'medium' : 'low';
  const now = new Date();
  const predictedAt = new Date(now.getTime() + profile.slaHours * 3600000);
  return {
    type,
    category: profile.label,
    priority,
    urgency,
    confidence,
    source,
    predictedResponseBy: predictedAt.toISOString(),
    rationale: `${profile.label} matched from report language${sensorRisk ? ' and elevated nearby sensor risk' : ''}.`
  };
}

function forecast(sensorReadings) {
  const floodSignals = sensorReadings.filter((reading) => reading.metric === 'water_level' && reading.value >= 70).length;
  const airSignals = sensorReadings.filter((reading) => reading.metric === 'air_quality' && reading.value >= 120).length;
  return {
    floodRisk: Math.min(99, 18 + floodSignals * 19),
    airQualityRisk: Math.min(99, 12 + airSignals * 16),
    horizon: 'next 6 hours'
  };
}

module.exports = { assessIssue, forecast };
