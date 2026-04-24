"""
HealthAI Intelligent Chatbot Engine
Integrates ML models, trained agents, and conversational AI for healthcare
"""

import json
import os
import pickle
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


class AIHealthChatbotEngine:
    """Advanced AI-powered healthcare chatbot with ML models"""
    
    def __init__(self):
        self.diseases = diesis_desc
        self.precautions = diesis_prec
        self.conversation_history = []
        self.user_context = {}
        self.models_loaded = False
        self._load_models()
        self._initialize_responses()
        
    def _load_models(self):
        """Load trained ML models"""
        try:
            model_dir = os.path.join(os.path.dirname(__file__), 'ai/trained_models')
            
            # Load trained models
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
                    except:
                        pass
            
            self.models_loaded = len(self.models) > 0
        except Exception as e:
            print(f"Error loading models: {e}")
            self.models_loaded = False
    
    def _initialize_responses(self):
        """Initialize response templates"""
        self.response_templates = {
            'greeting': [
                "Hi there! 👋 I'm your HealthAI assistant. How can I help you today?",
                "Hello! Welcome to HealthAI. What health concerns can I assist with?",
                "Hey! I'm here to help with any health-related questions. What's on your mind?"
            ],
            'symptom_inquiry': [
                "I understand you're experiencing symptoms. Can you tell me more about them?",
                "Let's explore your symptoms. When did they start?",
                "I'm here to help. Can you describe your symptoms in detail?"
            ],
            'disease_info': [
                "Here's what I found about that condition:",
                "Let me share some information about that disease:",
                "Based on your question, here's what you should know:"
            ],
            'emergency': [
                "🚨 EMERGENCY ALERT! Please call 911 or your local emergency number immediately!",
                "This requires immediate medical attention. Call emergency services now!",
                "⚠️ This is a medical emergency. Seek immediate professional help!"
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
            'loss of consciousness', 'choking', 'severe burn'
        ]
        
        self.symptom_keywords = [
            'pain', 'ache', 'fever', 'cough', 'headache', 'nausea', 'vomiting',
            'diarrhea', 'fatigue', 'weakness', 'dizziness', 'rash', 'itching',
            'swelling', 'bleeding', 'discharge', 'symptom'
        ]
    
    def chat(self, user_message: str, user_id: str = None) -> Dict:
        """Process user message and generate intelligent response"""
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
                return self._handle_symptoms(user_message, user_id)
            elif intent == 'disease':
                return self._handle_disease_query(user_message)
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
        
        # Emergency detection
        if any(kw in message_lower for kw in self.emergency_keywords):
            return 'emergency'
        
        # Symptom detection
        if any(kw in message_lower for kw in self.symptom_keywords):
            return 'symptoms'
        
        # Disease information
        if any(word in message_lower for word in ['disease', 'condition', 'illness', 'what is', 'tell me about']):
            return 'disease'
        
        # Greeting
        if any(word in message_lower for word in ['hi', 'hello', 'hey', 'greetings', 'start']):
            return 'greeting'
        
        # Health tips
        if any(word in message_lower for word in ['tips', 'advice', 'help', 'how to', 'prevent']):
            return 'health_tips'
        
        # Medication
        if any(word in message_lower for word in ['medicine', 'medication', 'drug', 'pill', 'prescription']):
            return 'medication'
        
        return 'general'
    
    def _handle_emergency(self, keyword: Optional[str]) -> Dict:
        """Handle emergency situations"""
        return {
            'success': True,
            'response': random.choice(self.response_templates['emergency']) + 
                       '\n\nDo not wait for online consultation. Seek immediate medical attention.',
            'type': 'emergency',
            'is_emergency': True,
            'actions': [
                'Call 911 or local emergency number',
                'Go to nearest hospital',
                'Inform family members',
                'Keep patient calm and comfortable'
            ]
        }
    
    def _handle_symptoms(self, message: str, user_id: Optional[str]) -> Dict:
        """Handle symptom-related queries"""
        # Extract symptoms from message
        symptoms = self._extract_symptoms(message)
        
        response = random.choice(self.response_templates['symptom_inquiry'])
        
        if symptoms:
            response += f"\n\nI detected these symptoms: {', '.join(symptoms)}"
            
            # Find related diseases
            related_diseases = self._find_related_diseases(symptoms)
            if related_diseases:
                response += f"\n\nThese symptoms might be related to: {', '.join(related_diseases[:3])}"
                response += "\n\nHowever, please consult a doctor for proper diagnosis."
        
        response += "\n\n" + random.choice(self.response_templates['follow_up'])
        
        return {
            'success': True,
            'response': response,
            'type': 'symptoms',
            'symptoms_detected': symptoms,
            'related_diseases': self._find_related_diseases(symptoms)[:5]
        }
    
    def _handle_disease_query(self, message: str) -> Dict:
        """Handle disease information queries"""
        # Extract disease name from message
        disease_name = self._extract_disease_name(message)
        
        if disease_name and disease_name in self.diseases:
            disease_info = self.diseases[disease_name]
            precautions = self.precautions.get(disease_name, [])
            
            response = random.choice(self.response_templates['disease_info']) + "\n\n"
            response += f"**{disease_name.upper()}**\n\n"
            response += f"{disease_info}\n\n"
            
            if precautions:
                response += "**Precautions:**\n"
                for i, precaution in enumerate(precautions[:5], 1):
                    response += f"{i}. {precaution}\n"
            
            response += "\n" + random.choice(self.response_templates['follow_up'])
            
            return {
                'success': True,
                'response': response,
                'type': 'disease_info',
                'disease': disease_name,
                'precautions': precautions
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
        response += "\n\nI can help you with:\n"
        response += "• Symptom analysis\n"
        response += "• Disease information\n"
        response += "• Health tips and advice\n"
        response += "• Medication information\n"
        response += "• General health questions"
        
        return {
            'success': True,
            'response': response,
            'type': 'greeting'
        }
    
    def _handle_health_tips(self) -> Dict:
        """Handle health tips requests"""
        tips = [
            "💧 Stay hydrated: Drink at least 8 glasses of water daily",
            "🏃 Exercise regularly: Aim for 30 minutes of physical activity daily",
            "😴 Get enough sleep: 7-9 hours per night is recommended",
            "🥗 Eat healthy: Include fruits, vegetables, and whole grains",
            "🧘 Manage stress: Practice meditation or yoga",
            "🚫 Avoid smoking and excessive alcohol",
            "🦷 Maintain oral hygiene: Brush twice daily",
            "👀 Regular check-ups: Visit your doctor annually",
            "🧼 Wash hands frequently: Especially before eating",
            "📱 Limit screen time: Take breaks every hour"
        ]
        
        response = "Here are some health tips for you:\n\n"
        response += "\n".join(random.sample(tips, 3))
        response += "\n\n" + random.choice(self.response_templates['follow_up'])
        
        return {
            'success': True,
            'response': response,
            'type': 'health_tips',
            'tips': random.sample(tips, 3)
        }
    
    def _handle_medication_query(self, message: str) -> Dict:
        """Handle medication-related queries"""
        response = "Regarding medications:\n\n"
        response += "⚠️ **Important**: Always consult with a healthcare professional before taking any medication.\n\n"
        response += "I can provide general information, but:\n"
        response += "• Never self-diagnose\n"
        response += "• Always follow doctor's prescriptions\n"
        response += "• Be aware of potential side effects\n"
        response += "• Check for drug interactions\n"
        response += "• Report any adverse reactions to your doctor\n\n"
        response += "What specific medication would you like to know about?"
        
        return {
            'success': True,
            'response': response,
            'type': 'medication'
        }
    
    def _handle_general_query(self, message: str) -> Dict:
        """Handle general health queries"""
        response = "That's an interesting health question. "
        response += "While I can provide general information, "
        response += "I recommend consulting with a healthcare professional for personalized advice.\n\n"
        response += "Could you provide more details about what you'd like to know?"
        
        return {
            'success': True,
            'response': response,
            'type': 'general'
        }
    
    def _extract_symptoms(self, message: str) -> List[str]:
        """Extract symptoms from user message"""
        symptoms = []
        message_lower = message.lower()
        
        for symptom in self.symptom_keywords:
            if symptom in message_lower:
                symptoms.append(symptom)
        
        return list(set(symptoms))
    
    def _extract_disease_name(self, message: str) -> Optional[str]:
        """Extract disease name from message"""
        message_lower = message.lower()
        
        for disease in self.diseases.keys():
            if disease.lower() in message_lower:
                return disease
        
        return None
    
    def _find_related_diseases(self, symptoms: List[str]) -> List[str]:
        """Find diseases related to symptoms"""
        related = []
        
        for disease, precautions in self.precautions.items():
            for symptom in symptoms:
                if symptom in str(precautions).lower():
                    related.append(disease)
                    break
        
        return list(set(related))[:10]
    
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
ai_chatbot_engine = AIHealthChatbotEngine()
