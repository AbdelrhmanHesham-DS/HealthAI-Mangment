"""
AI Context Service - Builds intelligent context from patient health data
"""
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
client = MongoClient(MONGO_URI)
db = client['healthai']

class AIContextService:
    """Service for building AI context from patient health data"""
    
    def __init__(self):
        self.health_metrics_collection = db['healthmetrics']
        self.users_collection = db['users']
        
        # Metric type categories
        self.blood_level_types = [
            'hemoglobin', 'white_blood_cells', 'platelets', 'red_blood_cells',
            'hematocrit', 'mcv', 'mch', 'mchc'
        ]
        
        self.sugar_level_types = [
            'fasting_glucose', 'postprandial_glucose', 'hba1c', 
            'random_glucose', 'blood_sugar'
        ]
    
    def build_patient_context(self, patient_id: str, options: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Builds AI context from patient health data
        
        Args:
            patient_id: Patient's MongoDB ObjectId
            options: Context options (maxMetrics, historyMonths, maxTokens)
            
        Returns:
            Formatted context object for AI consumption
        """
        if options is None:
            options = {}
        
        max_metrics = options.get('maxMetrics', 10)
        history_months = options.get('historyMonths', 12)
        max_tokens = options.get('maxTokens', 2000)
        
        try:
            # Load patient demographics
            patient = self.users_collection.find_one(
                {'_id': patient_id},
                {'name': 1, 'email': 1, 'dateOfBirth': 1, 'gender': 1}
            )
            
            if not patient:
                raise ValueError('Patient not found')
            
            # Calculate age
            age = None
            if patient.get('dateOfBirth'):
                dob = patient['dateOfBirth']
                if isinstance(dob, str):
                    dob = datetime.fromisoformat(dob)
                age = (datetime.now() - dob).days // 365
            
            # Calculate date range for medical history
            history_start_date = datetime.now() - timedelta(days=history_months * 30)
            
            # Query recent blood levels
            blood_levels = list(self.health_metrics_collection.find(
                {
                    'patientId': patient_id,
                    'type': {'$in': self.blood_level_types}
                },
                sort=[('recordedAt', -1)],
                limit=max_metrics
            ))
            
            # Query recent sugar levels
            sugar_levels = list(self.health_metrics_collection.find(
                {
                    'patientId': patient_id,
                    'type': {'$in': self.sugar_level_types}
                },
                sort=[('recordedAt', -1)],
                limit=max_metrics
            ))
            
            # Query other recent metrics
            other_metrics = list(self.health_metrics_collection.find(
                {
                    'patientId': patient_id,
                    'type': {'$nin': self.blood_level_types + self.sugar_level_types}
                },
                sort=[('recordedAt', -1)],
                limit=max_metrics
            ))
            
            # Identify clinical flags
            clinical_flags = self._identify_clinical_flags(
                blood_levels + sugar_levels + other_metrics,
                patient.get('gender')
            )
            
            # Build context object
            context = {
                'patientId': str(patient_id),
                'demographics': {
                    'name': patient.get('name'),
                    'age': age,
                    'gender': patient.get('gender')
                },
                'recentMetrics': {
                    'bloodLevels': self._format_metrics(blood_levels),
                    'sugarLevels': self._format_metrics(sugar_levels),
                    'otherMetrics': self._format_metrics(other_metrics)
                },
                'clinicalFlags': clinical_flags[:10]  # Limit to top 10 flags
            }
            
            # Prioritize context if it exceeds token limits
            if max_tokens:
                context = self._prioritize_context(context, max_tokens)
            
            return context
            
        except Exception as e:
            print(f'Error building patient context: {str(e)}')
            raise
    
    def _format_metrics(self, metrics: List[Dict]) -> List[Dict]:
        """Format metrics for AI consumption"""
        formatted = []
        for metric in metrics:
            formatted.append({
                'type': metric.get('type'),
                'value': metric.get('value'),
                'value2': metric.get('value2'),
                'unit': metric.get('unit'),
                'date': metric.get('recordedAt').isoformat() if metric.get('recordedAt') else None
            })
        return formatted
    
    def _identify_clinical_flags(self, metrics: List[Dict], gender: Optional[str] = None) -> List[Dict]:
        """Identify metrics that are out of clinical range"""
        from utils.clinical_ranges import is_out_of_range
        
        flags = []
        for metric in metrics:
            range_check = is_out_of_range(
                metric.get('type'),
                metric.get('value'),
                gender,
                metric.get('value2')
            )
            
            if not range_check['inRange']:
                flags.append({
                    'metric': metric.get('type'),
                    'status': range_check.get('severity'),
                    'value': metric.get('value'),
                    'message': range_check.get('message'),
                    'date': metric.get('recordedAt').isoformat() if metric.get('recordedAt') else None
                })
        
        return flags
    
    def _prioritize_context(self, context: Dict, max_tokens: int) -> Dict:
        """Prioritize data when context exceeds token limits"""
        import json
        
        # Estimate tokens (rough: 1 token ≈ 4 characters)
        def estimate_tokens(obj):
            return len(json.dumps(obj)) / 4
        
        current_tokens = estimate_tokens(context)
        
        if current_tokens <= max_tokens:
            return context
        
        # Priority: demographics > clinical flags > recent metrics
        prioritized = {
            'patientId': context['patientId'],
            'demographics': context['demographics'],
            'clinicalFlags': context['clinicalFlags'],
            'recentMetrics': {
                'bloodLevels': [],
                'sugarLevels': [],
                'otherMetrics': []
            }
        }
        
        # Add metrics until we hit the limit
        metrics_to_add = (
            context['recentMetrics']['bloodLevels'][:5] +
            context['recentMetrics']['sugarLevels'][:5] +
            context['recentMetrics']['otherMetrics'][:5]
        )
        
        for metric in metrics_to_add:
            metric_type = metric.get('type')
            category = 'otherMetrics'
            
            if metric_type in self.blood_level_types:
                category = 'bloodLevels'
            elif metric_type in self.sugar_level_types:
                category = 'sugarLevels'
            
            prioritized['recentMetrics'][category].append(metric)
            
            current_tokens = estimate_tokens(prioritized)
            if current_tokens > max_tokens:
                prioritized['recentMetrics'][category].pop()
                break
        
        return prioritized
    
    def format_metrics_for_ai(self, metrics: List[Dict]) -> str:
        """Format metrics as text for AI prompt injection"""
        if not metrics:
            return 'No metrics available'
        
        formatted_lines = []
        for metric in metrics:
            date = metric.get('recordedAt')
            if isinstance(date, datetime):
                date = date.strftime('%Y-%m-%d')
            
            value = metric.get('value')
            if metric.get('value2'):
                value = f"{metric.get('value')}/{metric.get('value2')}"
            
            metric_type = metric.get('type', '').replace('_', ' ')
            unit = metric.get('unit', '')
            
            formatted_lines.append(f"[{date}] {metric_type}: {value} {unit}")
        
        return '\n'.join(formatted_lines)


# Singleton instance
ai_context_service = AIContextService()
