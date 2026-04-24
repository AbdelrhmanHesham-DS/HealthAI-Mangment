"""
Analysis Service - Health data analysis and trend detection
Performs trend analysis, correlation detection, risk scoring, and anomaly detection
"""
import numpy as np
from scipy import stats
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
import json

class AnalysisService:
    """Service for analyzing patient health metrics and trends"""
    
    def __init__(self):
        self.clinical_ranges = self._load_clinical_ranges()
    
    def _load_clinical_ranges(self) -> dict:
        """Load clinical reference ranges for different metrics"""
        return {
            'blood_sugar': {
                'fasting': {'normal': (70, 100), 'prediabetic': (100, 126), 'diabetic': (126, float('inf'))},
                'postprandial': {'normal': (70, 140), 'prediabetic': (140, 200), 'diabetic': (200, float('inf'))}
            },
            'blood_pressure': {
                'normal': {'systolic': (0, 120), 'diastolic': (0, 80)},
                'elevated': {'systolic': (120, 130), 'diastolic': (0, 80)},
                'stage1': {'systolic': (130, 140), 'diastolic': (80, 90)},
                'stage2': {'systolic': (140, float('inf')), 'diastolic': (90, float('inf'))}
            },
            'cholesterol': {
                'total': {'desirable': (0, 200), 'borderline': (200, 240), 'high': (240, float('inf'))},
                'ldl': {'optimal': (0, 100), 'near_optimal': (100, 130), 'borderline': (130, 160), 'high': (160, 190), 'very_high': (190, float('inf'))},
                'hdl': {'low': (0, 40), 'good': (40, 60), 'excellent': (60, float('inf'))}
            },
            'bmi': {
                'underweight': (0, 18.5),
                'normal': (18.5, 25),
                'overweight': (25, 30),
                'obese': (30, float('inf'))
            }
        }
    
    def analyze_trend(self, metric_data: List[Dict], metric_type: str, months: int = 6) -> dict:
        """
        Analyze trend for a specific metric over time
        
        Args:
            metric_data: List of metric measurements with date and value
            metric_type: Type of metric (blood_sugar, blood_pressure, etc.)
            months: Number of months to analyze
            
        Returns:
            dict with trend analysis results
        """
        try:
            if not metric_data or len(metric_data) < 2:
                return {
                    'metric_type': metric_type,
                    'trend': 'insufficient_data',
                    'message': 'Not enough data points for trend analysis'
                }
            
            # Extract values and dates
            values = np.array([m.get('value', 0) for m in metric_data])
            dates = [m.get('date') for m in metric_data]
            
            # Calculate trend using linear regression
            x = np.arange(len(values))
            slope, intercept, r_value, p_value, std_err = stats.linregress(x, values)
            
            # Classify trend
            if abs(slope) < 0.1:
                trend_direction = 'stable'
            elif slope > 0:
                trend_direction = 'increasing'
            else:
                trend_direction = 'decreasing'
            
            # Calculate statistics
            mean_value = np.mean(values)
            std_value = np.std(values)
            min_value = np.min(values)
            max_value = np.max(values)
            
            # Calculate change percentage
            if len(values) > 1:
                change_percent = ((values[-1] - values[0]) / values[0] * 100) if values[0] != 0 else 0
            else:
                change_percent = 0
            
            # Determine clinical significance
            clinical_significance = self._assess_clinical_significance(
                metric_type, trend_direction, change_percent, values[-1]
            )
            
            return {
                'metric_type': metric_type,
                'trend': trend_direction,
                'slope': float(slope),
                'r_squared': float(r_value ** 2),
                'mean': float(mean_value),
                'std_dev': float(std_value),
                'min': float(min_value),
                'max': float(max_value),
                'latest_value': float(values[-1]),
                'change_percent': float(change_percent),
                'clinical_significance': clinical_significance,
                'data_points': len(values),
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                'metric_type': metric_type,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def find_correlations(self, metrics_data: Dict[str, List[Dict]]) -> dict:
        """
        Find correlations between different health metrics
        
        Args:
            metrics_data: Dict with metric types as keys and data lists as values
            
        Returns:
            dict with correlation findings
        """
        try:
            correlations = []
            metric_types = list(metrics_data.keys())
            
            # Compare each pair of metrics
            for i in range(len(metric_types)):
                for j in range(i + 1, len(metric_types)):
                    metric1 = metric_types[i]
                    metric2 = metric_types[j]
                    
                    data1 = metrics_data[metric1]
                    data2 = metrics_data[metric2]
                    
                    # Ensure same length
                    min_len = min(len(data1), len(data2))
                    if min_len < 2:
                        continue
                    
                    values1 = np.array([d.get('value', 0) for d in data1[:min_len]])
                    values2 = np.array([d.get('value', 0) for d in data2[:min_len]])
                    
                    # Calculate correlation coefficient
                    correlation = np.corrcoef(values1, values2)[0, 1]
                    
                    # Check for concurrent changes
                    changes1 = np.diff(values1)
                    changes2 = np.diff(values2)
                    
                    concurrent_changes = np.sum((changes1 > 0) & (changes2 > 0)) + np.sum((changes1 < 0) & (changes2 < 0))
                    concurrent_percent = (concurrent_changes / len(changes1) * 100) if len(changes1) > 0 else 0
                    
                    if abs(correlation) > 0.5 or concurrent_percent > 60:
                        correlations.append({
                            'metric1': metric1,
                            'metric2': metric2,
                            'correlation_coefficient': float(correlation),
                            'concurrent_changes_percent': float(concurrent_percent),
                            'strength': self._classify_correlation_strength(correlation),
                            'clinical_relevance': self._assess_correlation_relevance(metric1, metric2)
                        })
            
            return {
                'correlations': correlations,
                'total_pairs_analyzed': len(metric_types) * (len(metric_types) - 1) // 2,
                'significant_correlations': len(correlations),
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def calculate_risk_score(self, metrics: Dict[str, float], medical_history: List[str] = None) -> dict:
        """
        Calculate overall health risk score based on metrics
        
        Args:
            metrics: Dict of metric types and their current values
            medical_history: List of past medical conditions
            
        Returns:
            dict with risk score and breakdown
        """
        try:
            risk_factors = []
            total_risk = 0
            
            # Evaluate each metric
            for metric_type, value in metrics.items():
                risk_assessment = self._assess_metric_risk(metric_type, value)
                if risk_assessment['risk_level'] != 'normal':
                    risk_factors.append(risk_assessment)
                    total_risk += risk_assessment['risk_points']
            
            # Add medical history risk
            if medical_history:
                history_risk = self._assess_history_risk(medical_history)
                total_risk += history_risk['risk_points']
                risk_factors.append(history_risk)
            
            # Normalize risk score to 0-100
            risk_score = min(100, total_risk * 10)
            
            # Classify overall risk
            if risk_score < 20:
                risk_level = 'low'
            elif risk_score < 40:
                risk_level = 'moderate'
            elif risk_score < 60:
                risk_level = 'elevated'
            else:
                risk_level = 'high'
            
            return {
                'risk_score': float(risk_score),
                'risk_level': risk_level,
                'risk_factors': risk_factors,
                'recommendations': self._generate_risk_recommendations(risk_level, risk_factors),
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def detect_anomalies(self, metric_data: List[Dict], metric_type: str, threshold: float = 2.0) -> dict:
        """
        Detect statistical anomalies in metric data
        
        Args:
            metric_data: List of metric measurements
            metric_type: Type of metric
            threshold: Standard deviation threshold for anomaly detection
            
        Returns:
            dict with detected anomalies
        """
        try:
            if len(metric_data) < 3:
                return {
                    'metric_type': metric_type,
                    'anomalies': [],
                    'message': 'Insufficient data for anomaly detection'
                }
            
            values = np.array([m.get('value', 0) for m in metric_data])
            
            # Calculate z-scores
            mean = np.mean(values)
            std = np.std(values)
            
            if std == 0:
                return {
                    'metric_type': metric_type,
                    'anomalies': [],
                    'message': 'No variation in data'
                }
            
            z_scores = np.abs((values - mean) / std)
            
            # Find anomalies
            anomalies = []
            for i, (z_score, data_point) in enumerate(zip(z_scores, metric_data)):
                if z_score > threshold:
                    anomalies.append({
                        'index': i,
                        'value': float(data_point.get('value', 0)),
                        'date': data_point.get('date'),
                        'z_score': float(z_score),
                        'deviation_from_mean': float(values[i] - mean),
                        'severity': 'critical' if z_score > 3 else 'warning'
                    })
            
            return {
                'metric_type': metric_type,
                'anomalies': anomalies,
                'total_anomalies': len(anomalies),
                'mean': float(mean),
                'std_dev': float(std),
                'threshold_z_score': threshold,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                'metric_type': metric_type,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def _assess_clinical_significance(self, metric_type: str, trend: str, change_percent: float, latest_value: float) -> str:
        """Assess clinical significance of a trend"""
        if abs(change_percent) > 15:
            return 'significant'
        elif abs(change_percent) > 5:
            return 'moderate'
        else:
            return 'minimal'
    
    def _classify_correlation_strength(self, correlation: float) -> str:
        """Classify correlation strength"""
        abs_corr = abs(correlation)
        if abs_corr > 0.8:
            return 'very_strong'
        elif abs_corr > 0.6:
            return 'strong'
        elif abs_corr > 0.4:
            return 'moderate'
        else:
            return 'weak'
    
    def _assess_correlation_relevance(self, metric1: str, metric2: str) -> str:
        """Assess clinical relevance of metric correlation"""
        relevant_pairs = [
            ('blood_sugar', 'weight'),
            ('blood_pressure', 'stress'),
            ('cholesterol', 'weight'),
            ('blood_sugar', 'exercise')
        ]
        
        if (metric1, metric2) in relevant_pairs or (metric2, metric1) in relevant_pairs:
            return 'clinically_relevant'
        return 'potentially_relevant'
    
    def _assess_metric_risk(self, metric_type: str, value: float) -> dict:
        """Assess risk level for a specific metric"""
        risk_points = 0
        risk_level = 'normal'
        
        if metric_type == 'blood_sugar':
            if value > 126:
                risk_level = 'high'
                risk_points = 3
            elif value > 100:
                risk_level = 'elevated'
                risk_points = 1
        elif metric_type == 'blood_pressure_systolic':
            if value > 140:
                risk_level = 'high'
                risk_points = 3
            elif value > 130:
                risk_level = 'elevated'
                risk_points = 1
        elif metric_type == 'cholesterol':
            if value > 240:
                risk_level = 'high'
                risk_points = 2
            elif value > 200:
                risk_level = 'elevated'
                risk_points = 1
        
        return {
            'metric_type': metric_type,
            'value': value,
            'risk_level': risk_level,
            'risk_points': risk_points
        }
    
    def _assess_history_risk(self, medical_history: List[str]) -> dict:
        """Assess risk from medical history"""
        high_risk_conditions = ['diabetes', 'heart_disease', 'stroke', 'hypertension']
        risk_points = 0
        
        for condition in medical_history:
            if any(hrc in condition.lower() for hrc in high_risk_conditions):
                risk_points += 2
            else:
                risk_points += 1
        
        return {
            'source': 'medical_history',
            'conditions': medical_history,
            'risk_points': min(risk_points, 5)
        }
    
    def _generate_risk_recommendations(self, risk_level: str, risk_factors: List[Dict]) -> List[str]:
        """Generate recommendations based on risk level"""
        recommendations = []
        
        if risk_level == 'high':
            recommendations.append('Schedule an urgent appointment with your healthcare provider')
            recommendations.append('Monitor your health metrics daily')
            recommendations.append('Consider lifestyle modifications immediately')
        elif risk_level == 'elevated':
            recommendations.append('Schedule a check-up with your healthcare provider')
            recommendations.append('Increase monitoring frequency')
            recommendations.append('Review lifestyle and diet')
        elif risk_level == 'moderate':
            recommendations.append('Continue regular health monitoring')
            recommendations.append('Maintain healthy lifestyle habits')
        
        return recommendations

# Create singleton instance
analysis_service = AnalysisService()
