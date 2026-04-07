const HealthMetric = require('../models/HealthMetric');

// GET /api/metrics
exports.getMetrics = async (req, res) => {
  try {
    const filter = { patientId: req.user.id };
    if (req.query.type) filter.type = req.query.type;
    const metrics = await HealthMetric.find(filter).sort({ recordedAt: -1 }).limit(100);
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/metrics
exports.addMetric = async (req, res) => {
  try {
    const metric = await HealthMetric.create({ ...req.body, patientId: req.user.id });
    res.status(201).json(metric);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/metrics/:id
exports.deleteMetric = async (req, res) => {
  try {
    await HealthMetric.findOneAndDelete({ _id: req.params.id, patientId: req.user.id });
    res.json({ message: 'Metric deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/metrics/summary — latest readings + risk assessment + predictive risk
exports.getSummary = async (req, res) => {
  try {
    const types = ['blood_pressure', 'heart_rate', 'weight', 'blood_sugar', 'temperature', 'oxygen', 'steps'];
    const summary = {};

    for (const type of types) {
      const latest = await HealthMetric.findOne({ patientId: req.user.id, type }).sort({ recordedAt: -1 });
      if (latest) summary[type] = latest;
    }

    const risks = [];
    const predictions = [];

    // ── Blood Pressure ────────────────────────────────────────────────
    if (summary.blood_pressure) {
      const sys = summary.blood_pressure.value;
      const dia = summary.blood_pressure.value2 || 0;
      if (sys >= 180 || dia >= 120)
        risks.push({ level: 'emergency', message: 'Hypertensive crisis! Seek emergency care immediately.', type: 'blood_pressure' });
      else if (sys >= 140 || dia >= 90)
        risks.push({ level: 'high', message: 'Stage 2 hypertension. Consult a cardiologist urgently.', type: 'blood_pressure' });
      else if (sys >= 130 || dia >= 80)
        risks.push({ level: 'medium', message: 'Stage 1 hypertension. Monitor closely and reduce sodium intake.', type: 'blood_pressure' });

      // Predictive: trend analysis (last 5 readings)
      const bpHistory = await HealthMetric.find({ patientId: req.user.id, type: 'blood_pressure' })
        .sort({ recordedAt: -1 }).limit(5);
      if (bpHistory.length >= 3) {
        const avg = bpHistory.reduce((s, m) => s + m.value, 0) / bpHistory.length;
        const trend = bpHistory[0].value - bpHistory[bpHistory.length - 1].value;
        if (trend > 10 && avg >= 125)
          predictions.push({ risk: 'Hypertension Risk', level: 'high', reason: `BP trending up +${trend.toFixed(0)} mmHg over last ${bpHistory.length} readings (avg: ${avg.toFixed(0)})`, action: 'Consult a cardiologist' });
      }
    }

    // ── Blood Sugar ───────────────────────────────────────────────────
    if (summary.blood_sugar) {
      const bs = summary.blood_sugar.value;
      if (bs >= 200)
        risks.push({ level: 'high', message: 'High blood sugar (possible diabetes). Consult an endocrinologist.', type: 'blood_sugar' });
      else if (bs >= 126)
        risks.push({ level: 'medium', message: 'Elevated fasting glucose. Consider diabetes screening.', type: 'blood_sugar' });
      else if (bs < 70)
        risks.push({ level: 'high', message: 'Low blood sugar (hypoglycemia). Eat something sweet immediately.', type: 'blood_sugar' });

      // Predictive: combined BP + blood sugar = metabolic syndrome risk
      if (summary.blood_pressure && summary.blood_pressure.value >= 130 && bs >= 100) {
        predictions.push({
          risk: 'Metabolic Syndrome Risk',
          level: 'high',
          reason: `Elevated BP (${summary.blood_pressure.value} mmHg) + elevated blood sugar (${bs} mg/dL) — classic metabolic syndrome pattern`,
          action: 'Consult an endocrinologist and cardiologist',
        });
      }
    }

    // ── Heart Rate ────────────────────────────────────────────────────
    if (summary.heart_rate) {
      const hr = summary.heart_rate.value;
      if (hr > 120)
        risks.push({ level: 'high', message: 'Severe tachycardia. Seek medical attention.', type: 'heart_rate' });
      else if (hr > 100)
        risks.push({ level: 'medium', message: 'Elevated heart rate (tachycardia). Monitor and consult if persistent.', type: 'heart_rate' });
      else if (hr < 50)
        risks.push({ level: 'medium', message: 'Low heart rate (bradycardia). Consult a cardiologist.', type: 'heart_rate' });
    }

    // ── Oxygen Saturation ─────────────────────────────────────────────
    if (summary.oxygen) {
      const o2 = summary.oxygen.value;
      if (o2 < 90)
        risks.push({ level: 'emergency', message: 'Critically low oxygen. Seek emergency care immediately.', type: 'oxygen' });
      else if (o2 < 95)
        risks.push({ level: 'high', message: 'Low oxygen saturation. Consult a pulmonologist.', type: 'oxygen' });
    }

    // ── Temperature ───────────────────────────────────────────────────
    if (summary.temperature) {
      const temp = summary.temperature.value;
      if (temp >= 39.5)
        risks.push({ level: 'high', message: 'High fever. Seek medical attention.', type: 'temperature' });
      else if (temp >= 38)
        risks.push({ level: 'medium', message: 'Fever detected. Rest, hydrate, and monitor.', type: 'temperature' });
    }

    // ── Weight / BMI ──────────────────────────────────────────────────
    if (summary.weight) {
      const weightHistory = await HealthMetric.find({ patientId: req.user.id, type: 'weight' })
        .sort({ recordedAt: -1 }).limit(5);
      if (weightHistory.length >= 3) {
        const gain = weightHistory[0].value - weightHistory[weightHistory.length - 1].value;
        if (gain > 5)
          predictions.push({
            risk: 'Rapid Weight Gain',
            level: 'medium',
            reason: `+${gain.toFixed(1)} kg over last ${weightHistory.length} readings`,
            action: 'Consult a nutritionist or general practitioner',
          });
      }
    }

    // ── Activity ──────────────────────────────────────────────────────
    if (summary.steps) {
      const steps = summary.steps.value;
      if (steps < 3000)
        predictions.push({
          risk: 'Sedentary Lifestyle Risk',
          level: 'medium',
          reason: `Only ${steps.toLocaleString()} steps today — well below the 8,000 daily target`,
          action: 'Aim for 30 minutes of moderate exercise daily',
        });
    }

    // ── Combined predictive: BP + weight ─────────────────────────────
    if (summary.blood_pressure && summary.weight && summary.blood_pressure.value >= 130) {
      const weightHistory = await HealthMetric.find({ patientId: req.user.id, type: 'weight' })
        .sort({ recordedAt: -1 }).limit(3);
      if (weightHistory.length >= 2 && weightHistory[0].value > weightHistory[weightHistory.length - 1].value) {
        predictions.push({
          risk: 'Cardiovascular Risk',
          level: 'high',
          reason: `Elevated BP + increasing weight — combined risk factor for heart disease`,
          action: 'Consult a cardiologist and adopt a heart-healthy lifestyle',
        });
      }
    }

    res.json({ summary, risks, predictions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
