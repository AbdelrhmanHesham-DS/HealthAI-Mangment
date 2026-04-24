"""
Trend Analysis Service - AI-powered statistical analysis of health trends
"""
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import numpy as np
from scipy import stats
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
client = MongoClient(MONGO_URI)
db = client['healthai']

class TrendAnalysisService:
    """Service for analyzing health metric trends"""
    
    def __init__(self):
        self.health_metrics_collection = db['healthmetrics']
        
        # Metric-specific thresholds for clinical significance
        self.significance_thresholds = {
            'blood_sugar': {'low': 10, 'medium': 15, 'high': 25},
            'fasting_glucose': {'low': 10, 'medium': 15, 'high': 25},
            'hba1c': {'low': 5, 'medium': 10, 'high': 15},
            'blood_pressure': {'low': 5, 'medium': 10, 'high': 15},
            'cholesterol_total': {'low': 10, 'medium': 20, 'high': 30},
            'weight': {'low': 5, 'medium': 10, 'high': 15},
            'default': {'low': 10, 'medium': 20, 'high': 30}
        }
        
        # Known clinical correlations
        self.known_correlations = {
            'blood_pressure_weight': 'Weight changes often correlate with blood pressure',
            'blood_sugar_weight': 'Weight management affects blood glucose control',
            'cholesterol_total_weight': 'Weight loss typically improves cholesterol levels',
            'hba1c_fasting_glucose': 'HbA1c reflects long-term glucose control'
        }
    
    def analyze_trend(self, patient_id: str, metric_type: str, months: int = 6) -> Dict:
        """
        Analyzes trends for a specific metric type
        
        Args:
            patient_id: Patient's MongoDB ObjectId
            metric_type: Type of metric to analyze
            months: Number of months to analyze
            
        Returns:
            Trend analysis result
        """
        try:
            # Calculate date range
            end_date = datetime.now()
            start_date = end_date - timedelta(days=months * 30)
            
            # Retrieve metric history
            metrics = list(self.health_metrics_collection.find(
                {
                    'patientId': patient_id,
                    'type': metric_type,
                    'recordedAt': {'$gte': start_date, '$lte': end_date}
                },
                sort=[('recordedAt', 1)]
            ))
            
            if len(metrics) < 2:
                return {
                    'metricType': metric_type,
                    'period': f'{months} months',
                    'dataPoints': len(metrics),
                    'trend': 'insufficient_data',
                    'message': 'Not enough data points for trend analysis'
                }
            
            # Extract values
            values = [m.get('value') for m in metrics]
            
            # Calculate linear regression
            regression = self._calculate_linear_regression(values)
            
            # Classify trend
            trend = self._classify_trend(regression['slope'], regression['r_squared'])
            
            # Calculate statistics
            avg_value = np.mean(values)
            min_value = np.min(values)
            max_value = np.max(values)
            
            # Calculate recent vs previous averages
            mid_point = len(metrics) // 2
            recent_values = values[mid_point:]
            previous_values = values[:mid_point]
            
            recent_avg = np.mean(recent_values)
            previous_avg = np.mean(previous_values)
            
            change_percent = ((recent_avg - previous_avg) / previous_avg) * 100 if previous_avg != 0 else 0
            
            # Determine clinical significance
            clinical_significance = self._determine_clinical_significance(
                metric_type, change_percent, trend
            )
            
            # Generate alert if needed
            alert = self._generate_alerts({
                'metricType': metric_type,
                'trend': trend,
                'changePercent': change_percent,
                'clinicalSignificance': clinical_significance,
                'recentAverage': recent_avg,
                'previousAverage': previous_avg
            })
            
            return {
                'metricType': metric_type,
                'period': f'{months} months',
                'dataPoints': len(metrics),
                'trend': trend,
                'trendStrength': round(regression['r_squared'], 3),
                'averageValue': round(avg_value, 2),
                'minValue': round(min_value, 2),
                'maxValue': round(max_value, 2),
                'recentAverage': round(recent_avg, 2),
                'previousAverage': round(previous_avg, 2),
                'changePercent': round(change_percent, 2),
                'clinicalSignificance': clinical_significance,
                'alert': alert
            }
            
        except Exception as e:
            print(f'Error analyzing trend: {str(e)}')
            raise
    
    def _calculate_linear_regression(self, values: List[float]) -> Dict:
        """Calculate linear regression for trend analysis"""
        x = np.arange(len(values))
        y = np.array(values)
        
        # Calculate slope and intercept
        slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)
        r_squared = r_value ** 2
        
        return {
            'slope': slope,
            'intercept': intercept,
            'r_squared': r_squared,
            'p_value': p_value
        }
    
    def _classify_trend(self, slope: float, r_squared: float) -> str:
        """Classify trend based on slope and R-squared"""
        # If R-squared is low, trend is not reliable
        if r_squared < 0.3:
            return 'stable'
        
        # Classify based on slope
        if abs(slope) < 0.1:
            return 'stable'
        elif slope > 0:
            return 'increasing'
        else:
            return 'decreasing'
    
    def _determine_clinical_significance(self, metric_type: str, change_percent: float, trend: str) -> str:
        """Determine clinical significance of trend"""
        abs_change = abs(change_percent)
        
        threshold = self.significance_thresholds.get(metric_type, self.significance_thresholds['default'])
        
        if abs_change >= threshold['high']:
            return 'high'
        elif abs_change >= threshold['medium']:
            return 'medium'
        elif abs_change >= threshold['low']:
            return 'low'
        
        return 'low'
    
    def _generate_alerts(self, trend_data: Dict) -> Optional[Dict]:
        """Generate clinical alerts based on trends"""
        metric_type = trend_data['metricType']
        trend = trend_data['trend']
        change_percent = trend_data['changePercent']
        clinical_significance = trend_data['clinicalSignificance']
        
        # Only generate alerts for medium or high significance
        if clinical_significance == 'low' or trend == 'stable':
            return None
        
        direction = 'upward' if trend == 'increasing' else 'downward'
        change = abs(change_percent)
        
        # Metric-specific recommendations
        recommendations = {
            'blood_sugar': 'Consider HbA1c test and dietary review',
            'fasting_glucose': 'Review diet and medication adherence',
            'hba1c': 'Adjust diabetes management plan',
            'blood_pressure': 'Review medications and lifestyle factors',
            'cholesterol_total': 'Review diet and consider lipid panel',
            'weight': 'Discuss diet and exercise plan',
            'default': 'Schedule follow-up consultation'
        }
        
        recommendation = recommendations.get(metric_type, recommendations['default'])
        
        return {
            'level': clinical_significance,
            'message': f"{metric_type.replace('_', ' ')} trending {direction} by {change:.1f}% over analysis period",
            'recommendation': recommendation
        }
    
    def find_correlations(self, patient_id: str, metric_types: List[str]) -> List[Dict]:
        """
        Identifies correlations between different metrics
        
        Args:
            patient_id: Patient's MongoDB ObjectId
            metric_types: List of metric types to correlate
            
        Returns:
            List of correlation findings
        """
        try:
            if len(metric_types) < 2:
                return []
            
            # Get data for all metric types
            end_date = datetime.now()
            start_date = end_date - timedelta(days=180)  # 6 months
            
            metrics_data = {}
            for metric_type in metric_types:
                metrics = list(self.health_metrics_collection.find(
                    {
                        'patientId': patient_id,
                        'type': metric_type,
                        'recordedAt': {'$gte': start_date, '$lte': end_date}
                    },
                    sort=[('recordedAt', 1)]
                ))
                metrics_data[metric_type] = metrics
            
            # Calculate correlations between pairs
            correlations = []
            for i in range(len(metric_types)):
                for j in range(i + 1, len(metric_types)):
                    type1 = metric_types[i]
                    type2 = metric_types[j]
                    
                    correlation = self._calculate_correlation(
                        metrics_data[type1],
                        metrics_data[type2]
                    )
                    
                    if correlation and abs(correlation['coefficient']) > 0.5:
                        strength = 'strong' if abs(correlation['coefficient']) > 0.7 else 'moderate'
                        
                        correlations.append({
                            'metric1': type1,
                            'metric2': type2,
                            'coefficient': round(correlation['coefficient'], 3),
                            'strength': strength,
                            'clinicalRelevance': self._assess_clinical_relevance(
                                type1, type2, correlation['coefficient']
                            )
                        })
            
            return correlations
            
        except Exception as e:
            print(f'Error finding correlations: {str(e)}')
            raise
    
    def _calculate_correlation(self, metrics1: List[Dict], metrics2: List[Dict]) -> Optional[Dict]:
        """Calculate correlation coefficient between two metric series"""
        if len(metrics1) < 3 or len(metrics2) < 3:
            return None
        
        values1 = np.array([m.get('value') for m in metrics1])
        values2 = np.array([m.get('value') for m in metrics2])
        
        n = min(len(values1), len(values2))
        if n < 3:
            return None
        
        x = values1[:n]
        y = values2[:n]
        
        # Calculate Pearson correlation coefficient
        coefficient = np.corrcoef(x, y)[0, 1]
        
        return {'coefficient': coefficient}
    
    def _assess_clinical_relevance(self, metric1: str, metric2: str, coefficient: float) -> str:
        """Assess clinical relevance of correlation"""
        key1 = f'{metric1}_{metric2}'
        key2 = f'{metric2}_{metric1}'
        
        if key1 in self.known_correlations:
            return self.known_correlations[key1]
        elif key2 in self.known_correlations:
            return self.known_correlations[key2]
        else:
            direction = 'Positive' if coefficient > 0 else 'Negative'
            return f'{direction} correlation observed between metrics'


# Singleton instance
trend_analysis_service = TrendAnalysisService()
