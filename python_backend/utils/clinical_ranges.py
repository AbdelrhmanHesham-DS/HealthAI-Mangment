"""
Clinical Ranges Utility - Validates health metrics against clinical reference ranges
"""
from typing import Dict, Optional

# Clinical reference ranges
CLINICAL_RANGES = {
    'hemoglobin': {
        'male': {'min': 13.5, 'max': 17.5, 'unit': 'g/dL'},
        'female': {'min': 12.0, 'max': 15.5, 'unit': 'g/dL'}
    },
    'white_blood_cells': {
        'default': {'min': 4.5, 'max': 11.0, 'unit': 'K/uL'}
    },
    'platelets': {
        'default': {'min': 150, 'max': 400, 'unit': 'K/uL'}
    },
    'red_blood_cells': {
        'male': {'min': 4.7, 'max': 6.1, 'unit': 'M/uL'},
        'female': {'min': 4.2, 'max': 5.4, 'unit': 'M/uL'}
    },
    'hematocrit': {
        'male': {'min': 40.7, 'max': 50.3, 'unit': '%'},
        'female': {'min': 36.1, 'max': 44.9, 'unit': '%'}
    },
    'fasting_glucose': {
        'default': {'min': 70, 'max': 100, 'unit': 'mg/dL'}
    },
    'blood_sugar': {
        'default': {'min': 70, 'max': 100, 'unit': 'mg/dL'}
    },
    'hba1c': {
        'default': {'min': 0, 'max': 5.7, 'unit': '%'}
    },
    'blood_pressure_systolic': {
        'default': {'min': 90, 'max': 120, 'unit': 'mmHg'}
    },
    'blood_pressure_diastolic': {
        'default': {'min': 60, 'max': 80, 'unit': 'mmHg'}
    },
    'cholesterol_total': {
        'default': {'min': 0, 'max': 200, 'unit': 'mg/dL'}
    },
    'ldl_cholesterol': {
        'default': {'min': 0, 'max': 100, 'unit': 'mg/dL'}
    },
    'hdl_cholesterol': {
        'default': {'min': 40, 'max': 300, 'unit': 'mg/dL'}
    },
    'triglycerides': {
        'default': {'min': 0, 'max': 150, 'unit': 'mg/dL'}
    },
    'creatinine': {
        'male': {'min': 0.7, 'max': 1.3, 'unit': 'mg/dL'},
        'female': {'min': 0.6, 'max': 1.1, 'unit': 'mg/dL'}
    },
    'bun': {
        'default': {'min': 7, 'max': 20, 'unit': 'mg/dL'}
    },
    'sodium': {
        'default': {'min': 136, 'max': 145, 'unit': 'mEq/L'}
    },
    'potassium': {
        'default': {'min': 3.5, 'max': 5.0, 'unit': 'mEq/L'}
    },
    'calcium': {
        'default': {'min': 8.5, 'max': 10.2, 'unit': 'mg/dL'}
    },
    'magnesium': {
        'default': {'min': 1.7, 'max': 2.2, 'unit': 'mg/dL'}
    },
    'phosphorus': {
        'default': {'min': 2.5, 'max': 4.5, 'unit': 'mg/dL'}
    },
    'alt': {
        'default': {'min': 7, 'max': 56, 'unit': 'U/L'}
    },
    'ast': {
        'default': {'min': 10, 'max': 40, 'unit': 'U/L'}
    },
    'bilirubin': {
        'default': {'min': 0.1, 'max': 1.2, 'unit': 'mg/dL'}
    },
    'albumin': {
        'default': {'min': 3.5, 'max': 5.0, 'unit': 'g/dL'}
    },
    'tsh': {
        'default': {'min': 0.4, 'max': 4.0, 'unit': 'mIU/L'}
    },
    'temperature': {
        'default': {'min': 36.1, 'max': 37.2, 'unit': '°C'}
    },
    'heart_rate': {
        'default': {'min': 60, 'max': 100, 'unit': 'bpm'}
    },
    'respiratory_rate': {
        'default': {'min': 12, 'max': 20, 'unit': 'breaths/min'}
    },
    'oxygen_saturation': {
        'default': {'min': 95, 'max': 100, 'unit': '%'}
    },
    'bmi': {
        'default': {'min': 18.5, 'max': 24.9, 'unit': 'kg/m²'}
    }
}


def is_out_of_range(
    metric_type: str,
    value: float,
    gender: Optional[str] = None,
    value2: Optional[float] = None
) -> Dict:
    """
    Checks if a metric value is within clinical range
    
    Args:
        metric_type: Type of metric
        value: Metric value
        gender: Patient gender (male/female)
        value2: Second value (for ranges like blood pressure)
        
    Returns:
        Dictionary with inRange, severity, and message
    """
    
    if metric_type not in CLINICAL_RANGES:
        return {
            'inRange': True,
            'severity': 'unknown',
            'message': f'No reference range available for {metric_type}'
        }
    
    ranges = CLINICAL_RANGES[metric_type]
    
    # Get appropriate range based on gender
    if gender and gender.lower() in ranges:
        range_data = ranges[gender.lower()]
    elif 'default' in ranges:
        range_data = ranges['default']
    else:
        range_data = list(ranges.values())[0]
    
    min_val = range_data.get('min')
    max_val = range_data.get('max')
    unit = range_data.get('unit', '')
    
    # Check if value is in range
    in_range = min_val <= value <= max_val
    
    if in_range:
        return {
            'inRange': True,
            'severity': 'normal',
            'message': f'{metric_type}: {value} {unit} (Normal)'
        }
    
    # Determine severity
    if value < min_val:
        severity = 'low'
        diff_percent = ((min_val - value) / min_val) * 100
        if diff_percent > 20:
            severity = 'critical_low'
        message = f'{metric_type}: {value} {unit} (Below normal - {severity})'
    else:
        severity = 'high'
        diff_percent = ((value - max_val) / max_val) * 100
        if diff_percent > 20:
            severity = 'critical_high'
        message = f'{metric_type}: {value} {unit} (Above normal - {severity})'
    
    return {
        'inRange': False,
        'severity': severity,
        'message': message
    }


def get_clinical_range(metric_type: str, gender: Optional[str] = None) -> Optional[Dict]:
    """Get clinical range for a metric type"""
    if metric_type not in CLINICAL_RANGES:
        return None
    
    ranges = CLINICAL_RANGES[metric_type]
    
    if gender and gender.lower() in ranges:
        return ranges[gender.lower()]
    elif 'default' in ranges:
        return ranges['default']
    else:
        return list(ranges.values())[0]


def get_all_metric_types() -> list:
    """Get list of all available metric types"""
    return list(CLINICAL_RANGES.keys())
