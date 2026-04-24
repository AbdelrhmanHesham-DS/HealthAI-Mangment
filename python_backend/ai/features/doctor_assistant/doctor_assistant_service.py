"""
HealthAI Doctor Assistant Service
Provides disease diagnosis, symptom analysis, and medical recommendations
"""
import json
import os
from typing import Dict, List, Tuple
from datetime import datetime

# Import doctor knowledge base
from .doctor_disease_descriptions import diesis_desc
from .doctor_symptom_precautions import diesis_prec


class DoctorAssistantService:
    """Doctor Assistant Service for medical diagnosis and recommendations"""
    
    def __init__(self):
        """Initialize the doctor assistant service"""
        self.disease_descriptions = diesis_desc
        self.disease_precautions = diesis_prec
        self.consultation_history = []
        
    def get_disease_description(self, disease_name: str) -> str:
        """Get detailed description of a disease"""
        # Normalize disease name
        normalized_name = disease_name.lower().strip()
        
        # Search in disease descriptions
        for key, description in self.disease_descriptions.items():
            if key.lower() == normalized_name:
                return description
        
        return f"No description found for {disease_name}"
    
    def get_disease_precautions(self, disease_name: str) -> str:
        """Get precautions and care instructions for a disease"""
        # Normalize disease name
        normalized_name = disease_name.lower().strip()
        
        # Search in disease precautions
        for key, precautions in self.disease_precautions.items():
            if key.lower() == normalized_name:
                return precautions
        
        return f"No precautions found for {disease_name}"
    
    def analyze_symptoms_for_diagnosis(self, symptoms: List[str]) -> Dict:
        """Analyze symptoms and suggest possible diseases"""
        if not symptoms:
            return {
                'status': 'error',
                'message': 'No symptoms provided',
                'possible_diseases': []
            }
        
        # Normalize symptoms
        normalized_symptoms = [s.lower().strip() for s in symptoms]
        
        # Find diseases that match the symptoms
        matching_diseases = {}
        
        for disease, disease_symptoms in self._get_disease_symptom_mapping().items():
            # Count matching symptoms
            matches = sum(1 for symptom in normalized_symptoms 
                         if symptom in [s.lower() for s in disease_symptoms])
            
            if matches > 0:
                matching_diseases[disease] = {
                    'match_count': matches,
                    'match_percentage': (matches / len(disease_symptoms)) * 100,
                    'description': self.get_disease_description(disease),
                    'precautions': self.get_disease_precautions(disease)
                }
        
        # Sort by match count
        sorted_diseases = sorted(
            matching_diseases.items(),
            key=lambda x: x[1]['match_count'],
            reverse=True
        )
        
        return {
            'status': 'success',
            'symptoms_analyzed': normalized_symptoms,
            'possible_diseases': [
                {
                    'disease': disease,
                    'match_count': info['match_count'],
                    'match_percentage': round(info['match_percentage'], 2),
                    'description': info['description'],
                    'precautions': info['precautions']
                }
                for disease, info in sorted_diseases[:5]  # Top 5 matches
            ],
            'timestamp': datetime.now().isoformat()
        }
    
    def get_consultation_advice(self, disease: str, symptoms: List[str]) -> Dict:
        """Get comprehensive consultation advice for a disease"""
        return {
            'status': 'success',
            'disease': disease,
            'symptoms': symptoms,
            'description': self.get_disease_description(disease),
            'precautions': self.get_disease_precautions(disease),
            'recommendations': self._get_recommendations(disease),
            'when_to_see_doctor': self._get_urgency_level(disease),
            'timestamp': datetime.now().isoformat()
        }
    
    def _get_disease_symptom_mapping(self) -> Dict[str, List[str]]:
        """Get mapping of diseases to their symptoms"""
        # This is a simplified mapping - in production, this would come from a database
        return {
            'Diabetes': ['fatigue', 'weight loss', 'excessive hunger', 'frequent urination'],
            'Hypertension': ['headache', 'chest pain', 'dizziness', 'shortness of breath'],
            'Common Cold': ['cough', 'sneezing', 'runny nose', 'sore throat'],
            'Flu': ['fever', 'cough', 'body aches', 'fatigue'],
            'Asthma': ['shortness of breath', 'chest tightness', 'cough', 'wheezing'],
            'Migraine': ['severe headache', 'nausea', 'sensitivity to light', 'vomiting'],
            'Arthritis': ['joint pain', 'stiffness', 'swelling', 'reduced mobility'],
            'Pneumonia': ['cough', 'fever', 'chest pain', 'shortness of breath'],
            'Bronchitis': ['cough', 'mucus production', 'fatigue', 'shortness of breath'],
            'Gastritis': ['stomach pain', 'nausea', 'vomiting', 'loss of appetite'],
        }
    
    def _get_recommendations(self, disease: str) -> List[str]:
        """Get health recommendations for a disease"""
        recommendations = {
            'Diabetes': [
                'Monitor blood sugar levels regularly',
                'Follow a balanced diet low in sugar',
                'Exercise regularly (30 minutes daily)',
                'Take prescribed medications on time',
                'Stay hydrated'
            ],
            'Hypertension': [
                'Reduce salt intake',
                'Exercise regularly',
                'Manage stress through meditation',
                'Maintain healthy weight',
                'Limit alcohol consumption'
            ],
            'Common Cold': [
                'Get plenty of rest',
                'Stay hydrated',
                'Use saline nasal drops',
                'Gargle with salt water',
                'Avoid smoking and secondhand smoke'
            ],
        }
        
        return recommendations.get(disease, ['Consult with a healthcare professional'])
    
    def _get_urgency_level(self, disease: str) -> Dict:
        """Get urgency level and when to see a doctor"""
        urgency_levels = {
            'Diabetes': {
                'level': 'moderate',
                'when': 'See a doctor if symptoms persist for more than 2 weeks',
                'emergency_signs': ['extreme thirst', 'rapid breathing', 'fruity breath smell']
            },
            'Hypertension': {
                'level': 'moderate',
                'when': 'See a doctor for regular monitoring',
                'emergency_signs': ['severe headache', 'chest pain', 'vision changes']
            },
            'Common Cold': {
                'level': 'low',
                'when': 'Usually resolves in 7-10 days',
                'emergency_signs': ['high fever', 'difficulty breathing', 'severe symptoms']
            },
        }
        
        return urgency_levels.get(disease, {
            'level': 'unknown',
            'when': 'Consult with a healthcare professional',
            'emergency_signs': []
        })
    
    def log_consultation(self, patient_id: str, disease: str, symptoms: List[str]) -> Dict:
        """Log a consultation for record keeping"""
        consultation = {
            'patient_id': patient_id,
            'disease': disease,
            'symptoms': symptoms,
            'timestamp': datetime.now().isoformat(),
            'advice': self.get_consultation_advice(disease, symptoms)
        }
        
        self.consultation_history.append(consultation)
        
        return {
            'status': 'success',
            'message': 'Consultation logged successfully',
            'consultation_id': len(self.consultation_history)
        }


# Create singleton instance
doctor_assistant = DoctorAssistantService()
