const CLINICAL_RANGES = {
  hemoglobin: {
    male: { min: 13.5, max: 17.5, unit: 'g/dL' },
    female: { min: 12.0, max: 15.5, unit: 'g/dL' }
  },
  white_blood_cells: {
    normal: { min: 4.0, max: 11.0, unit: '10^9/L' }
  },
  platelets: {
    normal: { min: 150, max: 400, unit: '10^9/L' }
  },
  red_blood_cells: {
    male: { min: 4.5, max: 5.9, unit: '10^12/L' },
    female: { min: 4.1, max: 5.1, unit: '10^12/L' }
  },
  hematocrit: {
    male: { min: 38.8, max: 50.0, unit: '%' },
    female: { min: 34.9, max: 44.5, unit: '%' }
  },
  fasting_glucose: {
    normal: { min: 70, max: 100, unit: 'mg/dL' },
    prediabetes: { min: 100, max: 125, unit: 'mg/dL' },
    diabetes: { min: 126, max: null, unit: 'mg/dL' }
  },
  postprandial_glucose: {
    normal: { min: 70, max: 140, unit: 'mg/dL' },
    prediabetes: { min: 140, max: 199, unit: 'mg/dL' },
    diabetes: { min: 200, max: null, unit: 'mg/dL' }
  },
  hba1c: {
    normal: { min: 4.0, max: 5.6, unit: '%' },
    prediabetes: { min: 5.7, max: 6.4, unit: '%' },
    diabetes: { min: 6.5, max: null, unit: '%' }
  },
  random_glucose: {
    normal: { min: 70, max: 125, unit: 'mg/dL' },
    elevated: { min: 125, max: 199, unit: 'mg/dL' },
    diabetes: { min: 200, max: null, unit: 'mg/dL' }
  },
  blood_sugar: {
    normal: { min: 70, max: 100, unit: 'mg/dL' },
    prediabetes: { min: 100, max: 125, unit: 'mg/dL' },
    diabetes: { min: 126, max: null, unit: 'mg/dL' }
  },
  blood_pressure: {
    systolic: {
      normal: { min: 90, max: 120, unit: 'mmHg' },
      elevated: { min: 120, max: 129, unit: 'mmHg' },
      stage1: { min: 130, max: 139, unit: 'mmHg' },
      stage2: { min: 140, max: 179, unit: 'mmHg' },
      crisis: { min: 180, max: null, unit: 'mmHg' }
    },
    diastolic: {
      normal: { min: 60, max: 80, unit: 'mmHg' },
      stage1: { min: 80, max: 89, unit: 'mmHg' },
      stage2: { min: 90, max: 119, unit: 'mmHg' },
      crisis: { min: 120, max: null, unit: 'mmHg' }
    }
  },
  cholesterol_total: {
    desirable: { min: 0, max: 200, unit: 'mg/dL' },
    borderline: { min: 200, max: 239, unit: 'mg/dL' },
    high: { min: 240, max: null, unit: 'mg/dL' }
  },
  ldl: {
    optimal: { min: 0, max: 100, unit: 'mg/dL' },
    near_optimal: { min: 100, max: 129, unit: 'mg/dL' },
    borderline: { min: 130, max: 159, unit: 'mg/dL' },
    high: { min: 160, max: 189, unit: 'mg/dL' },
    very_high: { min: 190, max: null, unit: 'mg/dL' }
  },
  hdl: {
    low: { min: 0, max: 40, unit: 'mg/dL' },
    normal: { min: 40, max: 60, unit: 'mg/dL' },
    high: { min: 60, max: null, unit: 'mg/dL' }
  },
  triglycerides: {
    normal: { min: 0, max: 150, unit: 'mg/dL' },
    borderline: { min: 150, max: 199, unit: 'mg/dL' },
    high: { min: 200, max: 499, unit: 'mg/dL' },
    very_high: { min: 500, max: null, unit: 'mg/dL' }
  },
  heart_rate: {
    normal: { min: 60, max: 100, unit: 'bpm' }
  },
  temperature: {
    normal: { min: 36.1, max: 37.2, unit: '°C' }
  },
  oxygen: {
    normal: { min: 95, max: 100, unit: '%' }
  }
};

/**
 * Determines if a health metric value is out of normal range
 * @param {string} metricType - Type of health metric
 * @param {number} value - Metric value
 * @param {string} patientGender - Patient's gender ('male' or 'female')
 * @param {number} value2 - Secondary value (for blood pressure diastolic)
 * @returns {Object} { inRange: boolean, severity: string, message: string }
 */
function isOutOfRange(metricType, value, patientGender = 'male', value2 = null) {
  const ranges = CLINICAL_RANGES[metricType];
  
  if (!ranges) {
    return { inRange: true, severity: 'normal', message: '' };
  }

  // Handle blood pressure specially (has systolic and diastolic)
  if (metricType === 'blood_pressure') {
    return checkBloodPressure(value, value2);
  }

  // Handle gender-specific ranges
  let rangeSet = ranges;
  if (ranges.male && ranges.female) {
    rangeSet = ranges[patientGender] || ranges.male;
  }

  // Handle multi-level ranges (normal, prediabetes, diabetes, etc.)
  if (ranges.normal || ranges.desirable || ranges.optimal) {
    return checkMultiLevelRange(metricType, value, ranges);
  }

  // Simple min/max range
  if (rangeSet.min !== undefined && rangeSet.max !== undefined) {
    if (value < rangeSet.min) {
      return {
        inRange: false,
        severity: 'low',
        message: `${metricType} is below normal range (${rangeSet.min}-${rangeSet.max} ${rangeSet.unit})`
      };
    }
    if (rangeSet.max !== null && value > rangeSet.max) {
      return {
        inRange: false,
        severity: 'high',
        message: `${metricType} is above normal range (${rangeSet.min}-${rangeSet.max} ${rangeSet.unit})`
      };
    }
    return { inRange: true, severity: 'normal', message: '' };
  }

  return { inRange: true, severity: 'normal', message: '' };
}

function checkBloodPressure(systolic, diastolic) {
  const systolicRanges = CLINICAL_RANGES.blood_pressure.systolic;
  const diastolicRanges = CLINICAL_RANGES.blood_pressure.diastolic;

  // Check crisis level first
  if (systolic >= 180 || (diastolic && diastolic >= 120)) {
    return {
      inRange: false,
      severity: 'emergency',
      message: 'Blood pressure is at crisis level - seek immediate medical attention'
    };
  }

  // Check stage 2
  if (systolic >= 140 || (diastolic && diastolic >= 90)) {
    return {
      inRange: false,
      severity: 'high',
      message: 'Blood pressure is at Stage 2 hypertension'
    };
  }

  // Check stage 1
  if (systolic >= 130 || (diastolic && diastolic >= 80)) {
    return {
      inRange: false,
      severity: 'medium',
      message: 'Blood pressure is at Stage 1 hypertension'
    };
  }

  // Check elevated
  if (systolic >= 120 && systolic < 130 && (!diastolic || diastolic < 80)) {
    return {
      inRange: false,
      severity: 'low',
      message: 'Blood pressure is elevated'
    };
  }

  // Normal range
  if (systolic >= 90 && systolic < 120 && (!diastolic || (diastolic >= 60 && diastolic < 80))) {
    return { inRange: true, severity: 'normal', message: '' };
  }

  // Below normal
  return {
    inRange: false,
    severity: 'low',
    message: 'Blood pressure is below normal range'
  };
}

function checkMultiLevelRange(metricType, value, ranges) {
  const levels = Object.keys(ranges).sort((a, b) => {
    const aMin = ranges[a].min || 0;
    const bMin = ranges[b].min || 0;
    return aMin - bMin;
  });

  for (const level of levels) {
    const range = ranges[level];
    if (range.min !== undefined && range.max !== undefined) {
      if (value >= range.min && (range.max === null || value <= range.max)) {
        const isNormal = level === 'normal' || level === 'desirable' || level === 'optimal';
        return {
          inRange: isNormal,
          severity: isNormal ? 'normal' : getSeverityFromLevel(level),
          message: isNormal ? '' : `${metricType} is in ${level.replace('_', ' ')} range`
        };
      }
    }
  }

  return { inRange: true, severity: 'normal', message: '' };
}

function getSeverityFromLevel(level) {
  const severityMap = {
    'low': 'low',
    'elevated': 'low',
    'borderline': 'medium',
    'near_optimal': 'low',
    'prediabetes': 'medium',
    'stage1': 'medium',
    'high': 'high',
    'stage2': 'high',
    'diabetes': 'high',
    'very_high': 'high',
    'crisis': 'emergency'
  };
  return severityMap[level] || 'medium';
}

module.exports = {
  CLINICAL_RANGES,
  isOutOfRange
};
