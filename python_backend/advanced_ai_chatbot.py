"""
Advanced AI Healthcare Chatbot Engine
Integrates all datasets, trained models, and medical knowledge
"""

import json
import os
import pickle
import csv
import random
import numpy as np
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# Import medical data
try:
    from ai.features.doctor_assistant.doctor_disease_descriptions import diesis_desc
    from ai.features.doctor_assistant.doctor_symptom_precautions import diesis_prec
except:
    diesis_desc = {}
    diesis_prec = {}


class AdvancedAIHealthChatbot:
    """Ultra-powerful AI healthcare chatbot with all datasets integrated"""
    
    def __init__(self):
        self.diseases = diesis_desc
        self.precautions = diesis_prec
        self.conversation_history = []
        self.user_context = {}
        
        # Load all datasets
        self.symptom_severity = {}
        self.symptom_descriptions = {}
        self.disease_questions = {}
        self.training_data = []
        self.testing_data = []
        self.general_dataset = []
        self.heart_disease_data = []
        
        self._load_all_datasets()
        self._load_models()
        self._initialize_responses()
        
    def _load_all_datasets(self):
        """Load all CSV datasets"""
        dataset_dir = os.path.join(os.path.dirname(__file__), 'ai/datasets')
        
        try:
            # Load symptom severity
            severity_file = os.path.join(dataset_dir, 'healthai_symptom_severity.csv')
            if os.path.exists(severity_file):
                with open(severity_file, 'r') as f:
                    for line in f:
                        parts = line.strip().split(',')
                        if len(parts) == 2:
                            self.symptom_severity[parts[0]] = int(parts[1])
            
            # Load symptom descriptions
            desc_file = os.path.join(dataset_dir, 'healthai_symptom_descriptions.csv')
            if os.path.exists(desc_file):
                with open(desc_file, 'r', encoding='utf-8') as f:
                    reader = csv.reader(f)
                    for row in reader:
                        if len(row) >= 2:
                            self.symptom_descriptions[row[0]] = row[1]
            
            # Load training data
            train_file = os.path.join(dataset_dir, 'healthai_training_data.csv')
            if os.path.exists(train_file):
                with open(train_file, 'r', encoding='utf-8') as f:
                    reader = csv.reader(f)
                    for row in reader:
                        if row:
                            self.training_data.append(row)
            
            # Load testing data
            test_file = os.path.join(dataset_dir, 'healthai_testing_data.csv')
            if os.path.exists(test_file):
                with open(test_file, 'r', encoding='utf-8') as f:
                    reader = csv.reader(f)
                    for row in reader:
                        if row:
                            self.testing_data.append(row)
            
            # Load general dataset
            general_file = os.path.join(dataset_dir, 'healthai_general_dataset.csv')
            if os.path.exists(general_file):
                with open(general_file, 'r', encoding='utf-8') as f:
                    reader = csv.reader(f)
                    for row in reader:
                        if row:
                            self.general_dataset.append(row)
            
            # Load heart disease data
            heart_file = os.path.join(dataset_dir, 'healthai_heart_disease.csv')
            if os.path.exists(heart_file):
                with open(heart_file, 'r', encoding='utf-8') as f:
                    reader = csv.reader(f)
                    for row in reader:
                        if row:
                            self.heart_disease_data.append(row)
            
            print(f"✅ Loaded {len(self.symptom_severity)} symptoms with severity")
            print(f"✅ Loaded {len(self.symptom_descriptions)} symptom descriptions")
            print(f"✅ Loaded {len(self.training_data)} training samples")
            print(f"✅ Loaded {len(self.testing_data)} testing samples")
            
        except Exception as e:
            print(f"⚠️ Error loading datasets: {e}")
    
    def _load_models(self):
        """Load trained ML models"""
        try:
            model_dir = os.path.join(os.path.dirname(__file__), 'ai/trained_models')
            self.models = {}
            
            model_files = {
                'words': 'words.pkl',
                'classes': 'classes.pkl',
                'responses': 'responseDF.pkl',
                'faq_embeddings': 'faq_embeddings.pkl',
                'trained_agents': 'trained_agents.pkl'
            }
            
            for key, filename in model_files.items():
                filepath = os.path.join(model_dir, filename)
                if os.path.exists(filepath):
                    try:
                        with open(filepath, 'rb') as f:
                            self.models[key] = pickle.load(f)
                            print(f"✅ Loaded {key} model")
                    except:
                        pass
        except Exception as e:
            print(f"⚠️ Error loading models: {e}")
    
    def _initialize_responses(self):
        """Initialize response templates"""
        self.response_templates = {
            'greeting': [
                "👋 Welcome to HealthAI! I'm your intelligent healthcare assistant. How can I help you today?",
                "Hello! I'm HealthAI, your personal health advisor. What health concerns can I assist with?",
                "Hi there! 🏥 I'm here to provide medical guidance and health information. What's on your mind?"
            ],
            'symptom_inquiry': [
                "I understand you're experiencing symptoms. Let me help you understand what might be going on.",
                "Tell me more about your symptoms. When did they start and how severe are they?",
                "Let's explore your symptoms together. Can you describe them in detail?"
            ],
            'disease_info': [
                "Here's comprehensive information about that condition:",
                "Let me share what I know about this disease:",
                "Based on your question, here's detailed medical information:"
            ],
            'emergency': [
                "🚨 EMERGENCY ALERT! This requires immediate medical attention. Call 911 or your local emergency number NOW!",
                "⚠️ This is a medical emergency. Please seek immediate professional help!",
                "🚑 CRITICAL: Do not wait. Call emergency services immediately!"
            ],
            'follow_up': [
                "Is there anything else you'd like to know?",
                "Do you have any other health concerns?",
                "Would you like more information about anything else?"
            ]
        }
        
        self.emergency_keywords = [
            'chest pain', 'difficulty breathing', 'can\'t breathe', 'severe bleeding',
            'unconscious', 'poisoning', 'severe allergic', 'stroke', 'heart attack',
            'emergency', 'ambulance', 'critical', 'severe', 'urgent', 'dying',
            'loss of consciousness', 'choking', 'severe burn', 'anaphylaxis'
        ]
    
    def chat(self, user_message: str, user_id: str = None) -> Dict:
        """Process user message with advanced AI"""
        try:
            # Detect emergency
            is_emergency, keyword = self._detect_emergency(user_message)
            if is_emergency:
                return self._handle_emergency(keyword)
            
            # Classify intent
            intent = self._classify_intent(user_message)
            
            # Route to appropriate handler
            if intent == 'emergency':
                return self._handle_emergency(None)
            elif intent == 'symptoms':
                return self._handle_symptoms_advanced(user_message, user_id)
            elif intent == 'disease':
                return self._handle_disease_query_advanced(user_message)
            elif intent == 'greeting':
                return self._handle_greeting()
            elif intent == 'health_tips':
                return self._handle_health_tips()
            elif intent == 'medication':
                return self._handle_medication_query(user_message)
            else:
                return self._handle_general_query(user_message)
                
        except Exception as e:
            return {
                'success': False,
                'response': 'I encountered an error. Please try again.',
                'error': str(e),
                'type': 'error'
            }
    
    def _detect_emergency(self, message: str) -> Tuple[bool, Optional[str]]:
        """Detect emergency keywords"""
        message_lower = message.lower()
        for keyword in self.emergency_keywords:
            if keyword in message_lower:
                return True, keyword
        return False, None
    
    def _classify_intent(self, message: str) -> str:
        """Classify user message intent"""
        message_lower = message.lower()
        
        if any(kw in message_lower for kw in self.emergency_keywords):
            return 'emergency'
        
        if any(word in message_lower for word in ['symptom', 'pain', 'ache', 'fever', 'cough', 'headache', 'sick', 'ill']):
            return 'symptoms'
        
        if any(word in message_lower for word in ['disease', 'condition', 'illness', 'what is', 'tell me about', 'diabetes', 'cancer', 'heart']):
            return 'disease'
        
        if any(word in message_lower for word in ['hi', 'hello', 'hey', 'greetings', 'start', 'welcome']):
            return 'greeting'
        
        if any(word in message_lower for word in ['tips', 'advice', 'help', 'how to', 'prevent', 'healthy']):
            return 'health_tips'
        
        if any(word in message_lower for word in ['medicine', 'medication', 'drug', 'pill', 'prescription']):
            return 'medication'
        
        return 'general'
    
    def _handle_emergency(self, keyword: Optional[str]) -> Dict:
        """Handle emergency situations"""
        return {
            'success': True,
            'response': random.choice(self.response_templates['emergency']) + 
                       '\n\n**Do not wait for online consultation. Seek immediate medical attention.**',
            'type': 'emergency',
            'is_emergency': True,
            'actions': [
                '📞 Call 911 or local emergency number',
                '🏥 Go to nearest hospital',
                '👨‍👩‍👧 Inform family members',
                '😌 Keep patient calm and comfortable'
            ]
        }
    
    def _handle_symptoms_advanced(self, message: str, user_id: Optional[str]) -> Dict:
        """Handle symptoms with advanced analysis"""
        symptoms = self._extract_symptoms(message)
        severity_score = self._calculate_severity(symptoms)
        related_diseases = self._find_related_diseases_advanced(symptoms)
        
        response = random.choice(self.response_templates['symptom_inquiry']) + "\n\n"
        
        if symptoms:
            response += f"**Symptoms Detected:** {', '.join(symptoms)}\n"
            response += f"**Severity Score:** {severity_score}/10\n\n"
            
            if related_diseases:
                response += f"**Possible Conditions:**\n"
                for i, disease in enumerate(related_diseases[:3], 1):
                    response += f"{i}. {disease}\n"
                    if disease in self.symptom_descriptions:
                        response += f"   ℹ️ {self.symptom_descriptions[disease][:100]}...\n"
            
            response += "\n⚠️ **Important:** This is not a diagnosis. Please consult a healthcare professional.\n"
        
        response += "\n" + random.choice(self.response_templates['follow_up'])
        
        return {
            'success': True,
            'response': response,
            'type': 'symptoms',
            'symptoms_detected': symptoms,
            'severity_score': severity_score,
            'related_diseases': related_diseases[:5],
            'recommendations': self._get_recommendations(symptoms, severity_score)
        }
    
    def _handle_disease_query_advanced(self, message: str) -> Dict:
        """Handle disease queries with advanced information"""
        disease_name = self._extract_disease_name(message)
        
        if disease_name and disease_name in self.diseases:
            disease_info = self.diseases[disease_name]
            precautions = self.precautions.get(disease_name, [])
            
            response = random.choice(self.response_templates['disease_info']) + "\n\n"
            response += f"## {disease_name.upper()}\n\n"
            response += f"{disease_info}\n\n"
            
            if precautions:
                response += "### Precautions & Prevention:\n"
                for i, precaution in enumerate(precautions[:5], 1):
                    response += f"{i}. {precaution}\n"
            
            response += "\n### When to See a Doctor:\n"
            response += "- If symptoms persist for more than a few days\n"
            response += "- If symptoms worsen\n"
            response += "- If you develop new symptoms\n"
            response += "- If you have risk factors for this condition\n"
            
            response += "\n" + random.choice(self.response_templates['follow_up'])
            
            return {
                'success': True,
                'response': response,
                'type': 'disease_info',
                'disease': disease_name,
                'precautions': precautions,
                'severity': 'high' if any(word in disease_name.lower() for word in ['cancer', 'heart', 'stroke']) else 'medium'
            }
        else:
            return {
                'success': True,
                'response': "I couldn't find specific information about that disease. Could you provide more details or try a different disease name?",
                'type': 'disease_info'
            }
    
    def _handle_greeting(self) -> Dict:
        """Handle greeting messages"""
        response = random.choice(self.response_templates['greeting'])
        response += "\n\n**I can help you with:**\n"
        response += "🩺 Symptom analysis and disease information\n"
        response += "💊 Medication and treatment information\n"
        response += "❤️ Health tips and wellness advice\n"
        response += "🚨 Emergency guidance\n"
        response += "📊 General health questions\n"
        
        return {
            'success': True,
            'response': response,
            'type': 'greeting'
        }
    
    def _handle_health_tips(self) -> Dict:
        """Handle health tips requests"""
        tips = [
            "💧 **Hydration:** Drink at least 8 glasses of water daily for optimal health",
            "🏃 **Exercise:** Aim for 30 minutes of physical activity daily",
            "😴 **Sleep:** Get 7-9 hours of quality sleep per night",
            "🥗 **Nutrition:** Include fruits, vegetables, and whole grains in your diet",
            "🧘 **Stress:** Practice meditation or yoga for mental health",
            "🚫 **Avoid:** Limit smoking and excessive alcohol consumption",
            "🦷 **Oral Care:** Brush twice daily and floss regularly",
            "👀 **Vision:** Get regular eye check-ups",
            "🧼 **Hygiene:** Wash hands frequently, especially before eating",
            "📱 **Screen Time:** Take breaks every hour from screens"
        ]
        
        response = "### 💡 Health Tips for You:\n\n"
        response += "\n".join(random.sample(tips, 3))
        response += "\n\n" + random.choice(self.response_templates['follow_up'])
        
        return {
            'success': True,
            'response': response,
            'type': 'health_tips',
            'tips': random.sample(tips, 3)
        }
    
    def _handle_medication_query(self, message: str) -> Dict:
        """Handle medication queries"""
        response = "### 💊 Medication Information\n\n"
        response += "⚠️ **Important Disclaimer:** Always consult with a healthcare professional before taking any medication.\n\n"
        response += "**Key Points:**\n"
        response += "• Never self-diagnose or self-medicate\n"
        response += "• Always follow your doctor's prescriptions\n"
        response += "• Be aware of potential side effects\n"
        response += "• Check for drug interactions\n"
        response += "• Report any adverse reactions to your doctor\n"
        response += "• Store medications properly\n"
        response += "• Don't share medications with others\n\n"
        response += "What specific medication would you like to know about?"
        
        return {
            'success': True,
            'response': response,
            'type': 'medication'
        }
    
    def _handle_general_query(self, message: str) -> Dict:
        """Handle general health queries"""
        response = "That's an interesting health question. "
        response += "While I can provide general information, I recommend consulting with a healthcare professional for personalized advice.\n\n"
        response += "Could you provide more details about what you'd like to know?"
        
        return {
            'success': True,
            'response': response,
            'type': 'general'
        }
    
    def _extract_symptoms(self, message: str) -> List[str]:
        """Extract symptoms from message"""
        symptoms = []
        message_lower = message.lower()
        
        for symptom in self.symptom_severity.keys():
            if symptom.replace('_', ' ') in message_lower or symptom in message_lower:
                symptoms.append(symptom.replace('_', ' '))
        
        return list(set(symptoms))[:10]
    
    def _calculate_severity(self, symptoms: List[str]) -> int:
        """Calculate overall severity score"""
        if not symptoms:
            return 0
        
        total_severity = 0
        for symptom in symptoms:
            symptom_key = symptom.replace(' ', '_')
            total_severity += self.symptom_severity.get(symptom_key, 3)
        
        avg_severity = total_severity / len(symptoms)
        return min(10, int(avg_severity))
    
    def _extract_disease_name(self, message: str) -> Optional[str]:
        """Extract disease name from message"""
        message_lower = message.lower()
        
        for disease in self.diseases.keys():
            if disease.lower() in message_lower:
                return disease
        
        return None
    
    def _find_related_diseases_advanced(self, symptoms: List[str]) -> List[str]:
        """Find diseases related to symptoms using all datasets"""
        related = {}
        
        for disease, precautions in self.precautions.items():
            match_count = 0
            for symptom in symptoms:
                if symptom in str(precautions).lower():
                    match_count += 1
            
            if match_count > 0:
                related[disease] = match_count
        
        sorted_diseases = sorted(related.items(), key=lambda x: x[1], reverse=True)
        return [disease for disease, _ in sorted_diseases[:10]]
    
    def _get_recommendations(self, symptoms: List[str], severity: int) -> List[str]:
        """Get recommendations based on symptoms and severity"""
        recommendations = []
        
        if severity >= 7:
            recommendations.append("🚨 Seek immediate medical attention")
        elif severity >= 5:
            recommendations.append("⚠️ Schedule an appointment with your doctor soon")
        else:
            recommendations.append("💡 Monitor your symptoms and consult if they persist")
        
        recommendations.append("📋 Keep a symptom diary")
        recommendations.append("💧 Stay hydrated")
        recommendations.append("😴 Get adequate rest")
        
        return recommendations
    
    def add_to_history(self, user_message: str, bot_response: str) -> None:
        """Add message to conversation history"""
        self.conversation_history.append({
            'timestamp': datetime.now().isoformat(),
            'user': user_message,
            'bot': bot_response
        })
    
    def get_conversation_history(self) -> List[Dict]:
        """Get conversation history"""
        return self.conversation_history
    
    def clear_history(self) -> Dict:
        """Clear conversation history"""
        self.conversation_history = []
        return {'success': True, 'message': 'Conversation history cleared'}


# Initialize global chatbot instance
advanced_chatbot = AdvancedAIHealthChatbot()
