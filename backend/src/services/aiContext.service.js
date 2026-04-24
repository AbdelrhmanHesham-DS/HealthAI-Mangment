const HealthMetric = require('../models/HealthMetric');
const User = require('../models/User');
const { isOutOfRange } = require('../utils/clinicalRanges');

/**
 * Builds AI context from patient health data
 * @param {string} patientId - Patient's MongoDB ObjectId
 * @param {Object} options - Context options (timeRange, maxRecords)
 * @returns {Promise<Object>} Formatted context object
 */
async function buildPatientContext(patientId, options = {}) {
  const {
    maxMetrics = 10,
    historyMonths = 12,
    maxTokens = 2000
  } = options;

  try {
    // Load patient demographics
    const patient = await User.findById(patientId).select('name email dateOfBirth gender');
    if (!patient) {
      throw new Error('Patient not found');
    }

    const age = patient.dateOfBirth 
      ? Math.floor((Date.now() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

    // Calculate date range for medical history
    const historyStartDate = new Date();
    historyStartDate.setMonth(historyStartDate.getMonth() - historyMonths);

    // Blood level metric types
    const bloodLevelTypes = ['hemoglobin', 'white_blood_cells', 'platelets', 'red_blood_cells', 
                             'hematocrit', 'mcv', 'mch', 'mchc'];
    
    // Sugar level metric types
    const sugarLevelTypes = ['fasting_glucose', 'postprandial_glucose', 'hba1c', 'random_glucose', 'blood_sugar'];

    // Query recent blood levels
    const bloodLevels = await HealthMetric.find({
      patientId,
      type: { $in: bloodLevelTypes }
    })
    .sort({ recordedAt: -1 })
    .limit(maxMetrics)
    .lean();

    // Query recent sugar levels
    const sugarLevels = await HealthMetric.find({
      patientId,
      type: { $in: sugarLevelTypes }
    })
    .sort({ recordedAt: -1 })
    .limit(maxMetrics)
    .lean();

    // Query other recent metrics
    const otherMetrics = await HealthMetric.find({
      patientId,
      type: { $nin: [...bloodLevelTypes, ...sugarLevelTypes] }
    })
    .sort({ recordedAt: -1 })
    .limit(maxMetrics)
    .lean();

    // Identify clinical flags
    const clinicalFlags = [];
    const allMetrics = [...bloodLevels, ...sugarLevels, ...otherMetrics];
    
    for (const metric of allMetrics) {
      const rangeCheck = isOutOfRange(metric.type, metric.value, patient.gender, metric.value2);
      if (!rangeCheck.inRange) {
        clinicalFlags.push({
          metric: metric.type,
          status: rangeCheck.severity,
          value: metric.value,
          message: rangeCheck.message,
          date: metric.recordedAt
        });
      }
    }

    // Build context object
    const context = {
      patientId: patientId.toString(),
      demographics: {
        name: patient.name,
        age,
        gender: patient.gender
      },
      recentMetrics: {
        bloodLevels: bloodLevels.map(m => ({
          type: m.type,
          value: m.value,
          unit: m.unit,
          date: m.recordedAt
        })),
        sugarLevels: sugarLevels.map(m => ({
          type: m.type,
          value: m.value,
          unit: m.unit,
          date: m.recordedAt
        })),
        otherMetrics: otherMetrics.map(m => ({
          type: m.type,
          value: m.value,
          value2: m.value2,
          unit: m.unit,
          date: m.recordedAt
        }))
      },
      clinicalFlags: clinicalFlags.slice(0, 10) // Limit to top 10 flags
    };

    // Prioritize context if it exceeds token limits
    if (maxTokens) {
      return prioritizeContext(context, maxTokens);
    }

    return context;
  } catch (error) {
    console.error('Error building patient context:', error);
    throw error;
  }
}

/**
 * Formats health metrics for AI consumption
 * @param {Array} metrics - Array of HealthMetric documents
 * @returns {string} Formatted text suitable for AI prompt
 */
function formatMetricsForAI(metrics) {
  if (!metrics || metrics.length === 0) {
    return 'No metrics available';
  }

  const formatted = metrics.map(metric => {
    const date = new Date(metric.date || metric.recordedAt).toLocaleDateString();
    const value = metric.value2 
      ? `${metric.value}/${metric.value2}` 
      : metric.value;
    
    return `[${date}] ${metric.type.replace(/_/g, ' ')}: ${value} ${metric.unit}`;
  });

  return formatted.join('\n');
}

/**
 * Prioritizes data when context exceeds limits
 * @param {Object} contextData - Full context data
 * @param {number} maxTokens - Maximum token limit
 * @returns {Object} Prioritized context data
 */
function prioritizeContext(contextData, maxTokens) {
  // Estimate token count (rough approximation: 1 token ≈ 4 characters)
  const estimateTokens = (obj) => JSON.stringify(obj).length / 4;

  let currentTokens = estimateTokens(contextData);

  if (currentTokens <= maxTokens) {
    return contextData;
  }

  // Priority: demographics > clinical flags > recent metrics
  const prioritized = {
    patientId: contextData.patientId,
    demographics: contextData.demographics,
    clinicalFlags: contextData.clinicalFlags,
    recentMetrics: {
      bloodLevels: [],
      sugarLevels: [],
      otherMetrics: []
    }
  };

  // Add metrics until we hit the limit
  const metricsToAdd = [
    ...contextData.recentMetrics.bloodLevels.slice(0, 5),
    ...contextData.recentMetrics.sugarLevels.slice(0, 5),
    ...contextData.recentMetrics.otherMetrics.slice(0, 5)
  ];

  for (const metric of metricsToAdd) {
    const metricType = metric.type;
    let category = 'otherMetrics';
    
    if (['hemoglobin', 'white_blood_cells', 'platelets', 'red_blood_cells', 'hematocrit'].includes(metricType)) {
      category = 'bloodLevels';
    } else if (['fasting_glucose', 'postprandial_glucose', 'hba1c', 'random_glucose', 'blood_sugar'].includes(metricType)) {
      category = 'sugarLevels';
    }

    prioritized.recentMetrics[category].push(metric);
    
    currentTokens = estimateTokens(prioritized);
    if (currentTokens > maxTokens) {
      prioritized.recentMetrics[category].pop();
      break;
    }
  }

  return prioritized;
}

module.exports = {
  buildPatientContext,
  formatMetricsForAI,
  prioritizeContext
};
