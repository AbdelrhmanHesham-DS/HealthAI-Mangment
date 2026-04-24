const HealthMetric = require('../models/HealthMetric');

/**
 * Analyzes trends for a specific metric type
 * @param {string} patientId - Patient's MongoDB ObjectId
 * @param {string} metricType - Type of metric (blood_sugar, blood_pressure, etc.)
 * @param {number} months - Number of months to analyze (default: 6)
 * @returns {Promise<Object>} Trend analysis result
 */
async function analyzeTrend(patientId, metricType, months = 6) {
  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Retrieve metric history
    const metrics = await HealthMetric.find({
      patientId,
      type: metricType,
      recordedAt: { $gte: startDate, $lte: endDate }
    })
    .sort({ recordedAt: 1 })
    .lean();

    if (metrics.length < 2) {
      return {
        metricType,
        period: `${months} months`,
        dataPoints: metrics.length,
        trend: 'insufficient_data',
        message: 'Not enough data points for trend analysis'
      };
    }

    // Calculate linear regression
    const regression = calculateLinearRegression(metrics);
    
    // Classify trend
    const trend = classifyTrend(regression.slope, regression.rSquared);
    
    // Calculate statistics
    const values = metrics.map(m => m.value);
    const averageValue = values.reduce((a, b) => a + b, 0) / values.length;
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    // Calculate recent vs previous averages
    const midPoint = Math.floor(metrics.length / 2);
    const recentMetrics = metrics.slice(midPoint);
    const previousMetrics = metrics.slice(0, midPoint);
    
    const recentAverage = recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length;
    const previousAverage = previousMetrics.reduce((sum, m) => sum + m.value, 0) / previousMetrics.length;
    
    const changePercent = ((recentAverage - previousAverage) / previousAverage) * 100;

    // Determine clinical significance
    const clinicalSignificance = determineClinicalSignificance(metricType, changePercent, trend);

    // Generate alert if needed
    const alert = generateAlerts({
      metricType,
      trend,
      changePercent,
      clinicalSignificance,
      recentAverage,
      previousAverage
    });

    return {
      metricType,
      period: `${months} months`,
      dataPoints: metrics.length,
      trend,
      trendStrength: regression.rSquared,
      averageValue: Math.round(averageValue * 100) / 100,
      minValue,
      maxValue,
      recentAverage: Math.round(recentAverage * 100) / 100,
      previousAverage: Math.round(previousAverage * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      clinicalSignificance,
      alert
    };
  } catch (error) {
    console.error('Error analyzing trend:', error);
    throw error;
  }
}

/**
 * Calculates linear regression for trend analysis
 * @param {Array} metrics - Array of health metrics
 * @returns {Object} { slope, intercept, rSquared }
 */
function calculateLinearRegression(metrics) {
  const n = metrics.length;
  const x = metrics.map((_, i) => i); // Time index
  const y = metrics.map(m => m.value);

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared
  const yMean = sumY / n;
  const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
  const ssResidual = y.reduce((sum, yi, i) => {
    const predicted = slope * x[i] + intercept;
    return sum + Math.pow(yi - predicted, 2);
  }, 0);
  const rSquared = 1 - (ssResidual / ssTotal);

  return { slope, intercept, rSquared };
}

/**
 * Classifies trend based on slope and R-squared
 * @param {number} slope - Linear regression slope
 * @param {number} rSquared - R-squared value
 * @returns {string} Trend classification
 */
function classifyTrend(slope, rSquared) {
  // If R-squared is low, trend is not reliable
  if (rSquared < 0.3) {
    return 'stable';
  }

  // Classify based on slope
  if (Math.abs(slope) < 0.1) {
    return 'stable';
  } else if (slope > 0) {
    return 'increasing';
  } else {
    return 'decreasing';
  }
}

/**
 * Determines clinical significance of trend
 * @param {string} metricType - Type of metric
 * @param {number} changePercent - Percentage change
 * @param {string} trend - Trend direction
 * @returns {string} Clinical significance level
 */
function determineClinicalSignificance(metricType, changePercent, trend) {
  const absChange = Math.abs(changePercent);

  // Metric-specific thresholds
  const thresholds = {
    blood_sugar: { low: 10, medium: 15, high: 25 },
    fasting_glucose: { low: 10, medium: 15, high: 25 },
    hba1c: { low: 5, medium: 10, high: 15 },
    blood_pressure: { low: 5, medium: 10, high: 15 },
    cholesterol_total: { low: 10, medium: 20, high: 30 },
    weight: { low: 5, medium: 10, high: 15 },
    default: { low: 10, medium: 20, high: 30 }
  };

  const threshold = thresholds[metricType] || thresholds.default;

  if (absChange >= threshold.high) {
    return 'high';
  } else if (absChange >= threshold.medium) {
    return 'medium';
  } else if (absChange >= threshold.low) {
    return 'low';
  }

  return 'low';
}

/**
 * Generates clinical alerts based on trends
 * @param {Object} trendData - Trend analysis results
 * @returns {Object|null} Alert object or null
 */
function generateAlerts(trendData) {
  const { metricType, trend, changePercent, clinicalSignificance, recentAverage, previousAverage } = trendData;

  // Only generate alerts for medium or high significance
  if (clinicalSignificance === 'low' || trend === 'stable') {
    return null;
  }

  const direction = trend === 'increasing' ? 'upward' : 'downward';
  const change = Math.abs(changePercent).toFixed(1);

  // Metric-specific recommendations
  const recommendations = {
    blood_sugar: 'Consider HbA1c test and dietary review',
    fasting_glucose: 'Review diet and medication adherence',
    hba1c: 'Adjust diabetes management plan',
    blood_pressure: 'Review medications and lifestyle factors',
    cholesterol_total: 'Review diet and consider lipid panel',
    weight: 'Discuss diet and exercise plan',
    default: 'Schedule follow-up consultation'
  };

  const recommendation = recommendations[metricType] || recommendations.default;

  return {
    level: clinicalSignificance,
    message: `${metricType.replace(/_/g, ' ')} trending ${direction} by ${change}% over analysis period`,
    recommendation
  };
}

/**
 * Identifies correlations between different metrics
 * @param {string} patientId - Patient's MongoDB ObjectId
 * @param {Array<string>} metricTypes - Metric types to correlate
 * @returns {Promise<Array>} Correlation findings
 */
async function findCorrelations(patientId, metricTypes) {
  try {
    if (metricTypes.length < 2) {
      return [];
    }

    // Get data for all metric types
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);

    const metricsData = {};
    for (const type of metricTypes) {
      const metrics = await HealthMetric.find({
        patientId,
        type,
        recordedAt: { $gte: startDate, $lte: endDate }
      })
      .sort({ recordedAt: 1 })
      .lean();
      
      metricsData[type] = metrics;
    }

    // Calculate correlations between pairs
    const correlations = [];
    for (let i = 0; i < metricTypes.length; i++) {
      for (let j = i + 1; j < metricTypes.length; j++) {
        const type1 = metricTypes[i];
        const type2 = metricTypes[j];
        
        const correlation = calculateCorrelation(metricsData[type1], metricsData[type2]);
        
        if (correlation && Math.abs(correlation.coefficient) > 0.5) {
          correlations.push({
            metric1: type1,
            metric2: type2,
            coefficient: correlation.coefficient,
            strength: Math.abs(correlation.coefficient) > 0.7 ? 'strong' : 'moderate',
            clinicalRelevance: assessClinicalRelevance(type1, type2, correlation.coefficient)
          });
        }
      }
    }

    return correlations;
  } catch (error) {
    console.error('Error finding correlations:', error);
    throw error;
  }
}

/**
 * Calculates correlation coefficient between two metric series
 * @param {Array} metrics1 - First metric series
 * @param {Array} metrics2 - Second metric series
 * @returns {Object|null} Correlation result
 */
function calculateCorrelation(metrics1, metrics2) {
  if (metrics1.length < 3 || metrics2.length < 3) {
    return null;
  }

  // Align metrics by date (simplified - assumes similar recording patterns)
  const values1 = metrics1.map(m => m.value);
  const values2 = metrics2.map(m => m.value);
  
  const n = Math.min(values1.length, values2.length);
  if (n < 3) return null;

  const x = values1.slice(0, n);
  const y = values2.slice(0, n);

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const coefficient = numerator / Math.sqrt(denomX * denomY);

  return { coefficient };
}

/**
 * Assesses clinical relevance of correlation
 * @param {string} metric1 - First metric type
 * @param {string} metric2 - Second metric type
 * @param {number} coefficient - Correlation coefficient
 * @returns {string} Clinical relevance description
 */
function assessClinicalRelevance(metric1, metric2, coefficient) {
  const knownCorrelations = {
    'blood_pressure_weight': 'Weight changes often correlate with blood pressure',
    'blood_sugar_weight': 'Weight management affects blood glucose control',
    'cholesterol_total_weight': 'Weight loss typically improves cholesterol levels',
    'hba1c_fasting_glucose': 'HbA1c reflects long-term glucose control'
  };

  const key1 = `${metric1}_${metric2}`;
  const key2 = `${metric2}_${metric1}`;

  return knownCorrelations[key1] || knownCorrelations[key2] || 
         `${coefficient > 0 ? 'Positive' : 'Negative'} correlation observed between metrics`;
}

module.exports = {
  analyzeTrend,
  findCorrelations,
  generateAlerts
};
