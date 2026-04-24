"""
HealthAI Analyzer - Unified AI Healthcare Analysis Service
Consolidates all AI features for symptom analysis, diagnosis, and health guidance
Uses real medical databases from extracted healthcare projects
"""
import os
import json
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from enum import Enum
from pathlib import Path


class HealthAIFeature(Enum):
    """All available HealthAI features"""
    SYMPTOM_ANALYSIS = "symptom_analysis"
    DIAGNOSIS_PREDICTION = "diagnosis_prediction"
    LAB_RESULTS_ANALYSIS = "lab_results_analysis"
    EMERGENCY_GUIDANCE = "emergency_guidance"
    MEDICATION_REVIEW = "medication_review"
    HEALTH_METRICS_ANALYSIS = "health_metrics_analysis"
    DOCTOR_RECOMMENDATION = "doctor_recommendation"
    HEALTH_TIPS = "health_tips"
    EMERGENCY_DETECTION = "emergency_detection"


class HealthAIAnalyzer:
    """Master analyzer for all HealthAI healthcare features"""
    
    def __init__(self):
        self.model = "gpt-4-turbo"
        self.temperature = 0.8
        self.max_tokens = 500
        
        # All available features
        self.features = {
            HealthAIFeature.SYMPTOM_ANALYSIS.value: True,
            HealthAIFeature.DIAGNOSIS_PREDICTION.value: True,
            HealthAIFeature.LAB_RESULTS_ANALYSIS.value: True,
            HealthAIFeature.EMERGENCY_GUIDANCE.value: True,
            HealthAIFeature.MEDICATION_REVIEW.value: True,
            HealthAIFeature.HEALTH_METRICS_ANALYSIS.value: True,
            HealthAIFeature.DOCTOR_RECOMMENDATION.value: True,
            HealthAIFeature.HEALTH_TIPS.value: True,
            HealthAIFeature.EMERGENCY_DETECTION.value: True,
        }
        
        # Emergency keywords for detection
        self.emergency_keywords = [
            "can't breathe", "chest pain", "unconscious", "severe bleeding",
            "choking", "poisoning", "overdose", "severe allergic reaction",
            "stroke", "heart attack", "difficulty breathing", "loss of consciousness",
            "severe injury", "uncontrolled bleeding", "difficulty swallowing",
            "severe burns", "head injury", "spinal injury", "severe shock"
        ]
        
        # Load medical databases
        self.data_dir = Path(__file__).parent.parent / "data"
        self.disease_db = self._load_json("healthai_disease_database.json")
        self.lab_db = self._load_json("healthai_lab_reference_ranges.json")
        self.emergency_db = self._load_json("healthai_emergency_guidance.json")
        self.drug_db = self._load_json("healthai_drug_interactions.json")
        self.tips_db = self._load_json("healthai_health_tips.json")
    
    def _load_json(self, filename: str) -> Dict:
        """Load JSON database file"""
        try:
            filepath = self.data_dir / filename
            if filepath.exists():
                with open(filepath, 'r') as f:
                    return json.load(f)
        except Exception as e:
            print(f"Warning: Could not load {filename}: {e}")
        return {}
    
    # ========== 1. SYMPTOM ANALYSIS ==========
    def analyze_symptoms(self, symptoms: List[str], age: int = None, gender: str = None) -> Dict:
        """Analyze patient symptoms and suggest possible conditions"""
        try:
            from openai import OpenAI
            client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
            
            symptoms_text = ", ".join(symptoms)
            age_info = f"Age: {age}, " if age else ""
            gender_info = f"Gender: {gender}" if gender else ""
            
            prompt = f"""Analyze these patient symptoms: {symptoms_text}
{age_info}{gender_info}

Provide:
1. **Possible Conditions** (2-3 most likely)
2. **Severity Level** (Low/Medium/High/Critical)
3. **When to Seek Care** (Immediate/Soon/Can Wait)
4. **Recommended Actions**
5. **Specialist to Consult**

⚠️ This is NOT a diagnosis. Always consult a healthcare professional."""
            
            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {'role': 'system', 'content': 'You are a medical information assistant for HealthAI.'},
                    {'role': 'user', 'content': prompt}
                ],
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )
            
            return {
                'analysis': response.choices[0].message.content,
                'symptoms': symptoms,
                'feature': HealthAIFeature.SYMPTOM_ANALYSIS.value,
                'timestamp': datetime.now().isoformat(),
                'success': True
            }
        except Exception as e:
            return {'error': str(e), 'success': False}
    
    # ========== 2. DIAGNOSIS PREDICTION ==========
    def predict_diagnosis(self, symptoms: List[str], medical_history: List[str] = None) -> Dict:
        """Predict possible diagnoses based on symptoms and medical history"""
        try:
            from openai import OpenAI
            client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
            
            symptoms_text = ", ".join(symptoms)
            history_text = ""
            if medical_history:
                history_text = f"\nMedical History: {', '.join(medical_history)}"
            
            prompt = f"""Based on these symptoms: {symptoms_text}{history_text}

Predict possible diagnoses:
1. **Primary Diagnosis** (most likely)
2. **Differential Diagnoses** (other possibilities)
3. **Diagnostic Tests** needed
4. **Risk Factors** to consider
5. **Next Steps**

⚠️ This is informational only. Consult a healthcare professional."""
            
            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {'role': 'system', 'content': 'You are a medical diagnostician for HealthAI.'},
                    {'role': 'user', 'content': prompt}
                ],
                temperature=0.7,
                max_tokens=800
            )
            
            return {
                'prediction': response.choices[0].message.content,
                'symptoms': symptoms,
                'feature': HealthAIFeature.DIAGNOSIS_PREDICTION.value,
                'timestamp': datetime.now().isoformat(),
                'success': True
            }
        except Exception as e:
            return {'error': str(e), 'success': False}
    
    # ========== 3. LAB RESULTS ANALYSIS ==========
    def analyze_lab_results(self, test_results: Dict) -> Dict:
        """Analyze laboratory test results using real reference ranges"""
        try:
            analysis = {}
            lab_tests = self.lab_db.get('lab_tests', {})
            
            for test_name, test_value in test_results.items():
                if test_name in lab_tests:
                    test_info = lab_tests[test_name]
                    analysis[test_name] = {
                        'name': test_info.get('name'),
                        'unit': test_info.get('unit'),
                        'value': test_value,
                        'normal_range': test_info.get('normal_range'),
                        'description': test_info.get('description'),
                        'interpretation': self._interpret_lab_value(test_name, test_value, test_info)
                    }
            
            # Use AI for comprehensive analysis if API key available
            if os.getenv('OPENAI_API_KEY'):
                try:
                    from openai import OpenAI
                    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
                    
                    results_text = json.dumps(analysis, indent=2)
                    
                    prompt = f"""Analyze these lab test results:
{results_text}

Provide:
1. **Overall Assessment**
2. **Key Findings**
3. **Possible Causes** if abnormal
4. **Recommended Actions**
5. **When to Follow Up**

⚠️ This is informational only. Consult a healthcare professional."""
                    
                    response = client.chat.completions.create(
                        model=self.model,
                        messages=[
                            {'role': 'system', 'content': 'You are a medical lab analyst for HealthAI.'},
                            {'role': 'user', 'content': prompt}
                        ],
                        temperature=self.temperature,
                        max_tokens=self.max_tokens
                    )
                    
                    analysis['ai_analysis'] = response.choices[0].message.content
                except:
                    pass
            
            return {
                'analysis': analysis,
                'test_results': test_results,
                'feature': HealthAIFeature.LAB_RESULTS_ANALYSIS.value,
                'timestamp': datetime.now().isoformat(),
                'success': True
            }
        except Exception as e:
            return {'error': str(e), 'success': False}
    
    def _interpret_lab_value(self, test_name: str, value: float, test_info: Dict) -> str:
        """Interpret lab value against normal range"""
        try:
            normal_range = test_info.get('normal_range')
            if isinstance(normal_range, dict):
                # Handle gender-specific ranges
                normal_range = normal_range.get('male') or normal_range.get('female')
            
            if isinstance(normal_range, str):
                if '-' in normal_range:
                    parts = normal_range.split('-')
                    low = float(parts[0].strip())
                    high = float(parts[1].strip())
                    if value < low:
                        return f"Low (below {low})"
                    elif value > high:
                        return f"High (above {high})"
                    else:
                        return "Normal"
                elif '<' in normal_range:
                    threshold = float(normal_range.replace('<', '').strip())
                    return "Normal" if value < threshold else "High"
                elif '>' in normal_range:
                    threshold = float(normal_range.replace('>', '').strip())
                    return "Normal" if value > threshold else "Low"
            
            return "Unable to interpret"
        except:
            return "Unable to interpret"
    
    # ========== 4. EMERGENCY GUIDANCE ==========
    def get_emergency_guidance(self, emergency_description: str) -> Dict:
        """Provide emergency first aid guidance using real emergency database"""
        try:
            emergencies = self.emergency_db.get('emergencies', {})
            guidance_data = {}
            
            # Find matching emergency in database
            emergency_lower = emergency_description.lower()
            for emergency_key, emergency_info in emergencies.items():
                if emergency_key in emergency_lower or emergency_info.get('name', '').lower() in emergency_lower:
                    guidance_data = emergency_info
                    break
            
            # If found in database, use it
            if guidance_data:
                return {
                    'guidance': guidance_data,
                    'emergency': emergency_description,
                    'feature': HealthAIFeature.EMERGENCY_GUIDANCE.value,
                    'timestamp': datetime.now().isoformat(),
                    'critical': guidance_data.get('severity') in ['critical', 'high'],
                    'call_ambulance': guidance_data.get('call_ambulance', False),
                    'success': True
                }
            
            # Fallback to AI if not in database
            if os.getenv('OPENAI_API_KEY'):
                try:
                    from openai import OpenAI
                    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
                    
                    prompt = f"""Emergency: {emergency_description}

Provide IMMEDIATE first aid steps:
1. **Immediate Actions** (First 30 seconds)
2. **Step-by-Step Instructions** (numbered)
3. **What NOT to Do** (common mistakes)
4. **When to Call Emergency** (911/999/112)
5. **Recovery Tips**

⚠️ CRITICAL: If life-threatening, CALL EMERGENCY SERVICES IMMEDIATELY!"""
                    
                    response = client.chat.completions.create(
                        model=self.model,
                        messages=[
                            {'role': 'system', 'content': 'You are a first aid expert for HealthAI.'},
                            {'role': 'user', 'content': prompt}
                        ],
                        temperature=0.7,
                        max_tokens=800
                    )
                    
                    return {
                        'guidance': response.choices[0].message.content,
                        'emergency': emergency_description,
                        'feature': HealthAIFeature.EMERGENCY_GUIDANCE.value,
                        'timestamp': datetime.now().isoformat(),
                        'critical': True,
                        'success': True
                    }
                except:
                    pass
            
            return {
                'guidance': 'Emergency detected. Call emergency services immediately: 911 (US), 999 (UK), 112 (EU)',
                'emergency': emergency_description,
                'feature': HealthAIFeature.EMERGENCY_GUIDANCE.value,
                'timestamp': datetime.now().isoformat(),
                'critical': True,
                'call_ambulance': True,
                'success': True
            }
        except Exception as e:
            return {'error': str(e), 'success': False}
    
    # ========== 5. MEDICATION REVIEW ==========
    def review_medications(self, medications: List[Dict]) -> Dict:
        """Review medications for interactions and side effects using real drug database"""
        try:
            drugs = self.drug_db.get('drugs', {})
            medication_analysis = []
            interactions_found = []
            
            # Analyze each medication
            for med in medications:
                med_name = med.get('name', '').lower()
                med_info = None
                
                # Find medication in database
                for drug_key, drug_data in drugs.items():
                    if drug_key.lower() == med_name or drug_data.get('name', '').lower() == med_name:
                        med_info = drug_data
                        break
                
                if med_info:
                    medication_analysis.append({
                        'name': med_info.get('name'),
                        'category': med_info.get('category'),
                        'uses': med_info.get('uses'),
                        'dosage': med.get('dosage', med_info.get('common_dosage')),
                        'side_effects': med_info.get('side_effects'),
                        'warnings': med_info.get('warnings')
                    })
                else:
                    medication_analysis.append({
                        'name': med.get('name'),
                        'dosage': med.get('dosage'),
                        'note': 'Medication not found in database'
                    })
            
            # Check for interactions between medications
            med_names = [m.get('name', '').lower() for m in medications]
            for i, med1 in enumerate(med_names):
                for med2 in med_names[i+1:]:
                    for drug_key, drug_data in drugs.items():
                        if drug_key.lower() == med1:
                            interactions = drug_data.get('interactions', {})
                            for drug_name, interaction_desc in interactions.items():
                                if drug_name.lower() == med2:
                                    interactions_found.append({
                                        'drug1': med1,
                                        'drug2': med2,
                                        'interaction': interaction_desc
                                    })
            
            # Use AI for comprehensive analysis if API key available
            if os.getenv('OPENAI_API_KEY'):
                try:
                    from openai import OpenAI
                    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
                    
                    analysis_text = json.dumps({
                        'medications': medication_analysis,
                        'interactions': interactions_found
                    }, indent=2)
                    
                    prompt = f"""Review these medications:
{analysis_text}

Provide:
1. **Summary of Medications**
2. **Drug Interactions** (if any)
3. **Common Side Effects**
4. **Important Warnings**
5. **When to Contact Doctor**

⚠️ Always consult pharmacist or doctor."""
                    
                    response = client.chat.completions.create(
                        model=self.model,
                        messages=[
                            {'role': 'system', 'content': 'You are a pharmacist for HealthAI.'},
                            {'role': 'user', 'content': prompt}
                        ],
                        temperature=0.7,
                        max_tokens=800
                    )
                    
                    medication_analysis.append({
                        'ai_analysis': response.choices[0].message.content
                    })
                except:
                    pass
            
            return {
                'analysis': medication_analysis,
                'interactions': interactions_found,
                'medications': medications,
                'feature': HealthAIFeature.MEDICATION_REVIEW.value,
                'timestamp': datetime.now().isoformat(),
                'success': True
            }
        except Exception as e:
            return {'error': str(e), 'success': False}
    
    # ========== 6. HEALTH METRICS ANALYSIS ==========
    def analyze_health_metrics(self, health_metrics: Dict) -> Dict:
        """Analyze health metrics and provide recommendations"""
        try:
            from openai import OpenAI
            client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
            
            metrics_text = json.dumps(health_metrics, indent=2)
            
            prompt = f"""Analyze these health metrics:
{metrics_text}

Provide:
1. **Overall Health Status**
2. **Areas of Concern** (if any)
3. **Positive Indicators**
4. **Monitoring Recommendations**
5. **Lifestyle Suggestions**"""
            
            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {'role': 'system', 'content': 'You are a health coach for HealthAI.'},
                    {'role': 'user', 'content': prompt}
                ],
                temperature=0.8,
                max_tokens=800
            )
            
            return {
                'analysis': response.choices[0].message.content,
                'metrics': health_metrics,
                'feature': HealthAIFeature.HEALTH_METRICS_ANALYSIS.value,
                'timestamp': datetime.now().isoformat(),
                'success': True
            }
        except Exception as e:
            return {'error': str(e), 'success': False}
    
    # ========== 7. DOCTOR RECOMMENDATION ==========
    def recommend_doctor(self, patient_need: str, available_doctors: List[Dict] = None) -> Dict:
        """Recommend appropriate doctor based on patient needs"""
        try:
            from openai import OpenAI
            client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
            
            doctors_text = ""
            if available_doctors:
                doctors_text = f"\nAvailable Doctors:\n{json.dumps(available_doctors, indent=2)}"
            
            prompt = f"""Patient Need: {patient_need}{doctors_text}

Provide:
1. **Recommended Specialist**
2. **Urgency Level** (Routine/Soon/Urgent)
3. **Best Time to Schedule**
4. **Questions to Ask Doctor**
5. **Preparation Tips**"""
            
            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {'role': 'system', 'content': 'You are a medical appointment coordinator for HealthAI.'},
                    {'role': 'user', 'content': prompt}
                ],
                temperature=0.7,
                max_tokens=600
            )
            
            return {
                'recommendation': response.choices[0].message.content,
                'patient_need': patient_need,
                'feature': HealthAIFeature.DOCTOR_RECOMMENDATION.value,
                'timestamp': datetime.now().isoformat(),
                'success': True
            }
        except Exception as e:
            return {'error': str(e), 'success': False}
    
    # ========== 8. HEALTH TIPS ==========
    def get_health_tips(self, category: str = None) -> Dict:
        """Get personalized health tips from real database"""
        try:
            tips_data = self.tips_db.get('tips', {})
            
            if category and category in tips_data:
                tips = tips_data[category]
            elif category:
                # Try to find similar category
                category_lower = category.lower()
                for key in tips_data.keys():
                    if category_lower in key.lower() or key.lower() in category_lower:
                        tips = tips_data[key]
                        category = key
                        break
                else:
                    # Return random category if not found
                    tips = list(tips_data.values())[0] if tips_data else []
                    category = list(tips_data.keys())[0] if tips_data else 'General'
            else:
                # Return all tips if no category specified
                all_tips = []
                for cat, cat_tips in tips_data.items():
                    all_tips.extend([f"**{cat.replace('_', ' ').title()}**: {tip}" for tip in cat_tips])
                tips = all_tips
                category = 'All Categories'
            
            return {
                'tips': tips,
                'category': category or 'General',
                'feature': HealthAIFeature.HEALTH_TIPS.value,
                'timestamp': datetime.now().isoformat(),
                'success': True
            }
        except Exception as e:
            return {'error': str(e), 'success': False}
    
    # ========== 9. EMERGENCY DETECTION ==========
    def detect_emergency(self, message: str) -> Tuple[bool, str]:
        """Detect emergency keywords in message"""
        message_lower = message.lower()
        for keyword in self.emergency_keywords:
            if keyword in message_lower:
                return True, keyword
        return False, ""
    
    # ========== 10. GET ALL FEATURES ==========
    def get_all_features(self) -> Dict:
        """Get list of all available HealthAI features"""
        return {
            'features': self.features,
            'total_features': len([f for f in self.features.values() if f]),
            'feature_list': list(self.features.keys()),
            'ai_models': ['GPT-4-Turbo'],
            'timestamp': datetime.now().isoformat()
        }


# Create singleton instance
healthai_analyzer = HealthAIAnalyzer()
