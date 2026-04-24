"""
AI Integration Service - Unified AI Features
Integrates all AI models and chatbots from compressed folder projects
"""
import os
import json
from datetime import datetime
from typing import Dict, List, Optional

class AIIntegrationService:
    """Master service for all AI features"""
    
    def __init__(self):
        self.model = "gpt-4-turbo"
        self.temperature = 0.8
        self.max_tokens = 500
        
        # Feature flags
        self.features = {
            'symptom_analysis': True,
            'blood_test_analysis': True,
            'first_aid': True,
            'doctor_assistant': True,
            'medical_qa': True,
            'multilingual': True,
            'audio_input': True,
            'pdf_reports': True,
            'prescription_analysis': True,
            'drug_interaction': True,
            'health_monitoring': True,
            'appointment_assistant': True,
        }
    
    # ========== SYMPTOM ANALYSIS ==========
    def analyze_symptoms(self, symptoms: List[str], patient_age: int = None, gender: str = None) -> Dict:
        """
        Analyze symptoms and suggest possible conditions
        
        Args:
            symptoms: List of symptoms
            patient_age: Patient age (optional)
            gender: Patient gender (optional)
            
        Returns:
            Analysis with possible conditions, severity, and recommendations
        """
        try:
            from openai import OpenAI
            client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
            
            symptoms_text = ", ".join(symptoms)
            age_info = f"Age: {patient_age}, " if patient_age else ""
            gender_info = f"Gender: {gender}" if gender else ""
            
            prompt = f"""Analyze these symptoms: {symptoms_text}
{age_info}{gender_info}

Provide:
1. **Possible Conditions** (2-3 most likely)
2. **Severity Level** (Low/Medium/High/Critical)
3. **When to Seek Care** (Immediate/Soon/Can Wait)
4. **Recommended Actions** (What to do now)
5. **Specialist to Consult** (If needed)

⚠️ This is NOT a diagnosis. Always consult a healthcare professional."""
            
            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {'role': 'system', 'content': 'You are a medical information assistant. Provide helpful analysis without diagnosing.'},
                    {'role': 'user', 'content': prompt}
                ],
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )
            
            return {
                'analysis': response.choices[0].message.content,
                'symptoms': symptoms,
                'timestamp': datetime.now().isoformat(),
                'success': True,
                'feature': 'symptom_analysis'
            }
        except Exception as e:
            return {'error': str(e), 'success': False}
    
    # ========== BLOOD TEST ANALYSIS ==========
    def analyze_blood_test(self, test_results: Dict) -> Dict:
        """
        Analyze blood test results
        
        Args:
            test_results: Dict with test name and values
            
        Returns:
            Analysis of results with normal ranges and recommendations
        """
        try:
            from openai import OpenAI
            client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
            
            results_text = json.dumps(test_results, indent=2)
            
            prompt = f"""Analyze these blood test results:
{results_text}

Provide:
1. **Normal/Abnormal Status** for each test
2. **What Each Result Means** (in simple terms)
3. **Possible Causes** if abnormal
4. **Recommended Actions**
5. **When to Follow Up**

⚠️ This is informational only. Consult your doctor for interpretation."""
            
            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {'role': 'system', 'content': 'You are a medical lab analyst. Explain blood test results clearly.'},
                    {'role': 'user', 'content': prompt}
                ],
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )
            
            return {
                'analysis': response.choices[0].message.content,
                'test_results': test_results,
                'timestamp': datetime.now().isoformat(),
                'success': True,
                'feature': 'blood_test_analysis'
            }
        except Exception as e:
            return {'error': str(e), 'success': False}
    
    # ========== FIRST AID GUIDANCE ==========
    def get_first_aid_guidance(self, emergency: str) -> Dict:
        """
        Provide first aid guidance for emergencies
        
        Args:
            emergency: Description of emergency
            
        Returns:
            Step-by-step first aid instructions
        """
        try:
            from openai import OpenAI
            client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
            
            prompt = f"""Emergency: {emergency}

Provide IMMEDIATE first aid steps:
1. **Immediate Actions** (First 30 seconds)
2. **Step-by-Step Instructions** (numbered)
3. **What NOT to Do** (common mistakes)
4. **When to Call Emergency** (911/999/112)
5. **Recovery Tips** (after emergency care)

⚠️ CRITICAL: If life-threatening, CALL EMERGENCY SERVICES IMMEDIATELY!"""
            
            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {'role': 'system', 'content': 'You are a first aid expert. Provide clear, actionable emergency guidance.'},
                    {'role': 'user', 'content': prompt}
                ],
                temperature=0.7,  # Lower for accuracy
                max_tokens=800
            )
            
            return {
                'guidance': response.choices[0].message.content,
                'emergency': emergency,
                'timestamp': datetime.now().isoformat(),
                'success': True,
                'feature': 'first_aid',
                'critical': True
            }
        except Exception as e:
            return {'error': str(e), 'success': False}
    
    # ========== DOCTOR ASSISTANT ==========
    def doctor_assistant(self, task: str, patient_data: Dict = None) -> Dict:
        """
        AI Assistant for doctors - helps with documentation, diagnosis, etc.
        
        Args:
            task: What the doctor needs help with
            patient_data: Optional patient information
            
        Returns:
            AI-generated assistance for the doctor
        """
        try:
            from openai import OpenAI
            client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
            
            patient_context = ""
            if patient_data:
                patient_context = f"\nPatient Info: {json.dumps(patient_data, indent=2)}"
            
            prompt = f"""Doctor's Task: {task}{patient_context}

Provide professional medical assistance:
1. **Key Points** to consider
2. **Recommended Approach**
3. **Important Considerations**
4. **Documentation Suggestions**
5. **Follow-up Actions**

Note: This is AI assistance only. Doctor's clinical judgment is final."""
            
            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {'role': 'system', 'content': 'You are a medical assistant for doctors. Provide professional, evidence-based suggestions.'},
                    {'role': 'user', 'content': prompt}
                ],
                temperature=0.7,
                max_tokens=800
            )
            
            return {
                'assistance': response.choices[0].message.content,
                'task': task,
                'timestamp': datetime.now().isoformat(),
                'success': True,
                'feature': 'doctor_assistant'
            }
        except Exception as e:
            return {'error': str(e), 'success': False}
    
    # ========== PRESCRIPTION ANALYSIS ==========
    def analyze_prescription(self, medications: List[Dict]) -> Dict:
        """
        Analyze medications for interactions and side effects
        
        Args:
            medications: List of medications with names and dosages
            
        Returns:
            Analysis of interactions and warnings
        """
        try:
            from openai import OpenAI
            client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
            
            meds_text = json.dumps(medications, indent=2)
            
            prompt = f"""Analyze these medications for interactions:
{meds_text}

Provide:
1. **Drug Interactions** (if any)
2. **Common Side Effects**
3. **Warnings** (important precautions)
4. **Food/Alcohol Interactions**
5. **When to Contact Doctor**

⚠️ Always consult pharmacist or doctor before taking medications."""
            
            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {'role': 'system', 'content': 'You are a pharmacist. Provide accurate medication information.'},
                    {'role': 'user', 'content': prompt}
                ],
                temperature=0.7,
                max_tokens=800
            )
            
            return {
                'analysis': response.choices[0].message.content,
                'medications': medications,
                'timestamp': datetime.now().isoformat(),
                'success': True,
                'feature': 'prescription_analysis'
            }
        except Exception as e:
            return {'error': str(e), 'success': False}
    
    # ========== HEALTH MONITORING ==========
    def health_monitoring_analysis(self, health_metrics: Dict) -> Dict:
        """
        Analyze health metrics and provide monitoring recommendations
        
        Args:
            health_metrics: Dict with vital signs and health data
            
        Returns:
            Analysis and recommendations for health monitoring
        """
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
5. **Lifestyle Suggestions**

Note: This is informational. Consult doctor for medical advice."""
            
            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {'role': 'system', 'content': 'You are a health coach. Provide personalized health monitoring advice.'},
                    {'role': 'user', 'content': prompt}
                ],
                temperature=0.8,
                max_tokens=800
            )
            
            return {
                'analysis': response.choices[0].message.content,
                'metrics': health_metrics,
                'timestamp': datetime.now().isoformat(),
                'success': True,
                'feature': 'health_monitoring'
            }
        except Exception as e:
            return {'error': str(e), 'success': False}
    
    # ========== APPOINTMENT ASSISTANT ==========
    def appointment_assistant(self, request: str, available_doctors: List[Dict] = None) -> Dict:
        """
        AI assistant for appointment scheduling and doctor selection
        
        Args:
            request: Patient's appointment request
            available_doctors: List of available doctors
            
        Returns:
            Recommendations for appointment scheduling
        """
        try:
            from openai import OpenAI
            client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
            
            doctors_text = ""
            if available_doctors:
                doctors_text = f"\nAvailable Doctors:\n{json.dumps(available_doctors, indent=2)}"
            
            prompt = f"""Appointment Request: {request}{doctors_text}

Provide:
1. **Recommended Specialist** (based on request)
2. **Urgency Level** (Routine/Soon/Urgent)
3. **Best Time to Schedule** (if applicable)
4. **Questions to Ask Doctor**
5. **Preparation Tips**"""
            
            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {'role': 'system', 'content': 'You are a medical appointment coordinator. Help patients schedule appropriate care.'},
                    {'role': 'user', 'content': prompt}
                ],
                temperature=0.7,
                max_tokens=600
            )
            
            return {
                'recommendation': response.choices[0].message.content,
                'request': request,
                'timestamp': datetime.now().isoformat(),
                'success': True,
                'feature': 'appointment_assistant'
            }
        except Exception as e:
            return {'error': str(e), 'success': False}
    
    # ========== GET ALL FEATURES ==========
    def get_available_features(self) -> Dict:
        """Get list of all available AI features"""
        return {
            'features': self.features,
            'total_features': len([f for f in self.features.values() if f]),
            'timestamp': datetime.now().isoformat()
        }

# Create singleton instance
ai_integration_service = AIIntegrationService()
