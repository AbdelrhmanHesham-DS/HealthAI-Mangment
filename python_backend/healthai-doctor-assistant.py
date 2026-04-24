"""
HealthAI Doctor Assistant Service
Comprehensive doctor support features including disease info, precautions, and patient management
"""

import json
import os
from typing import Dict, List, Optional, Tuple
from datetime import datetime

# Import disease and precaution data
from ai.features.doctor_assistant.doctor_disease_descriptions import diesis_desc
from ai.features.doctor_assistant.doctor_symptom_precautions import diesis_prec


class DoctorAssistant:
    """Doctor Assistant for medical consultation support"""
    
    def __init__(self):
        self.diseases = diesis_desc
        self.precautions = diesis_prec
        self.timestamp = datetime.now().isoformat()
        
    def get_disease_info(self, disease_name: str) -> Dict:
        """Get detailed information about a disease"""
        try:
            normalized_name = disease_name.lower().strip()
            
            for disease_key, description in self.diseases.items():
                if disease_key.lower() == normalized_name:
                    precautions = self.precautions.get(disease_key, "No precautions available")
                    return {
                        'success': True,
                        'disease': disease_key,
                        'description': description,
                        'precautions': precautions,
                        'timestamp': self.timestamp
                    }
            
            return {
                'success': False,
                'error': f'Disease "{disease_name}" not found in database',
                'available_diseases': len(self.diseases),
                'timestamp': self.timestamp
            }
        except Exception as e:
            return {'success': False, 'error': str(e), 'timestamp': self.timestamp}
    
    def get_precautions(self, disease_name: str) -> Dict:
        """Get precautions for a specific disease"""
        try:
            normalized_name = disease_name.lower().strip()
            
            for disease_key, precautions in self.precautions.items():
                if disease_key.lower() == normalized_name:
                    return {
                        'success': True,
                        'disease': disease_key,
                        'precautions': precautions.strip().split('\n'),
                        'timestamp': self.timestamp
                    }
            
            return {
                'success': False,
                'error': f'Precautions for "{disease_name}" not found',
                'timestamp': self.timestamp
            }
        except Exception as e:
            return {'success': False, 'error': str(e), 'timestamp': self.timestamp}
    
    def search_diseases(self, keyword: str) -> Dict:
        """Search for diseases by keyword"""
        try:
            keyword_lower = keyword.lower()
            results = []
            
            for disease_name, description in self.diseases.items():
                if keyword_lower in disease_name.lower() or keyword_lower in description.lower():
                    results.append({
                        'disease': disease_name,
                        'description': description[:100] + '...' if len(description) > 100 else description,
                        'has_precautions': disease_name in self.precautions
                    })
            
            return {
                'success': True,
                'keyword': keyword,
                'results_count': len(results),
                'results': results,
                'timestamp': self.timestamp
            }
        except Exception as e:
            return {'success': False, 'error': str(e), 'timestamp': self.timestamp}
    
    def get_all_diseases(self) -> Dict:
        """Get list of all diseases in database"""
        try:
            disease_list = []
            for disease_name in self.diseases.keys():
                disease_list.append({
                    'name': disease_name,
                    'has_precautions': disease_name in self.precautions
                })
            
            return {
                'success': True,
                'total_diseases': len(disease_list),
                'diseases': disease_list,
                'timestamp': self.timestamp
            }
        except Exception as e:
            return {'success': False, 'error': str(e), 'timestamp': self.timestamp}
    
    def get_disease_summary(self, disease_name: str) -> Dict:
        """Get a quick summary of disease with key points"""
        try:
            normalized_name = disease_name.lower().strip()
            
            for disease_key, description in self.diseases.items():
                if disease_key.lower() == normalized_name:
                    precautions = self.precautions.get(disease_key, "")
                    precaution_list = [p.strip() for p in precautions.split('\n') if p.strip()]
                    
                    return {
                        'success': True,
                        'disease': disease_key,
                        'summary': description[:150] + '...' if len(description) > 150 else description,
                        'full_description': description,
                        'key_precautions': precaution_list[:3],
                        'total_precautions': len(precaution_list),
                        'timestamp': self.timestamp
                    }
            
            return {
                'success': False,
                'error': f'Disease "{disease_name}" not found',
                'timestamp': self.timestamp
            }
        except Exception as e:
            return {'success': False, 'error': str(e), 'timestamp': self.timestamp}
    
    def compare_diseases(self, disease_names: List[str]) -> Dict:
        """Compare multiple diseases"""
        try:
            comparison = []
            not_found = []
            
            for disease_name in disease_names:
                normalized_name = disease_name.lower().strip()
                found = False
                
                for disease_key, description in self.diseases.items():
                    if disease_key.lower() == normalized_name:
                        precautions = self.precautions.get(disease_key, "")
                        comparison.append({
                            'disease': disease_key,
                            'description_length': len(description),
                            'precautions_count': len([p for p in precautions.split('\n') if p.strip()]),
                            'description_preview': description[:80] + '...'
                        })
                        found = True
                        break
                
                if not found:
                    not_found.append(disease_name)
            
            return {
                'success': True,
                'compared': len(comparison),
                'not_found': not_found,
                'comparison': comparison,
                'timestamp': self.timestamp
            }
        except Exception as e:
            return {'success': False, 'error': str(e), 'timestamp': self.timestamp}
    
    def get_doctor_stats(self) -> Dict:
        """Get statistics about the doctor assistant database"""
        try:
            total_diseases = len(self.diseases)
            diseases_with_precautions = sum(1 for d in self.diseases.keys() if d in self.precautions)
            
            return {
                'success': True,
                'total_diseases': total_diseases,
                'diseases_with_precautions': diseases_with_precautions,
                'coverage_percentage': round((diseases_with_precautions / total_diseases * 100), 2) if total_diseases > 0 else 0,
                'timestamp': self.timestamp
            }
        except Exception as e:
            return {'success': False, 'error': str(e), 'timestamp': self.timestamp}


# Create singleton instance
doctor_assistant = DoctorAssistant()
