const sensorCatalog = [
  { id: 'WL-104', zone: 'Kalyan Nagar', metric: 'water_level', unit: '%', baseline: 54 },
  { id: 'AQ-201', zone: 'Market Circle', metric: 'air_quality', unit: 'AQI', baseline: 88 },
  { id: 'BIN-330', zone: 'Old Town', metric: 'bin_fill', unit: '%', baseline: 67 }
];

function createReading(sensor, index = 0) {
  const wave = Math.sin(Date.now() / 180000 + index) * 8;
  const value = Math.max(0, Math.round(sensor.baseline + wave + (sensor.metric === 'water_level' ? 15 : 0)));
  return { ...sensor, value, status: value >= 80 ? 'alert' : value >= 65 ? 'watch' : 'normal', recordedAt: new Date().toISOString() };
}

function sampleReadings() {
  return sensorCatalog.map(createReading);
}

module.exports = { sensorCatalog, sampleReadings, createReading };
