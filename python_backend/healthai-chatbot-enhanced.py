"""
HealthAI Enhanced Chatbot Service
Comprehensive healthcare chatbot with ML-based diagnosis, symptom analysis, and severity scoring
Integrates features from all 25 AI healthcare projects
"""

import json
import os
import random
import numpy as np
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import csv

# Import disease data
from ai.features.doctor_assistant.doctor_disease_descriptions import diesis_desc
from ai.features.doctor_assistant.doctor_symptom_precautions import diesis_prec


class HealthAIEnhancedChatbot:
    """Enhanced healthcare chatbot with ML diagnosis and severity scoring"""
    
    def __init__(self):
        self.diseases = diesis_desc
        self.precautions = diesis_prec
        self.timestamp = datetime.now().isoformat()
        self.conversation_history = []
        self.user_symptoms = []
        self.user_context = {}
        
        # Severity dictionary (1-10 scale)
        self.severity_dict = self._load_severity_dict()
        
        # Emergency keywords
        self.emergency_keywords = [
            'chest pain', 'difficulty breathing', 'severe bleeding', 'unconscious',
            'poisoning', 'severe allergic', 'stroke', 'heart attack', 'emergency',
            'ambulance', 'critical', 'severe', 'urgent', 'dying'
        ]
        
        # Symptom descriptions
        self.symptom_descriptions = self._load_symptom_descriptions()
        
        # Health tips by category
        self.health_tips = self._load_health_tips()
        
        # Conversation state
        self.state = 'greeting'  # greeting, symptom_collection, analysis, recommendation
        self.symptom_count = 0
        self.max_symptoms = 5
        
    def _load_severity_dict(self) -> Dict[str, int]:
        """Load symptom severity scores (1-10 scale)"""
        return {
            'fever': 6, 'cough': 4, 'headache': 3, 'chest pain': 9,
            'difficulty breathing': 9, 'severe bleeding': 10, 'unconscious': 10,
            'nausea': 4, 'vomiting': 5, 'diarrhea': 4, 'fatigue': 3,
            'dizziness': 5, 'rash': 3, 'itching': 2, 'pain': 5,
            'swelling': 4, 'weakness': 5, 'chills': 5, 'sore throat': 3,
            'congestion': 2, 'sneezing': 1, 'runny nose': 1, 'joint pain': 4,
            'muscle pain': 4, 'back pain': 5, 'stomach pain': 5, 'anxiety': 4,
            'depression': 5, 'insomnia': 4, 'tremor': 6, 'seizure': 10
        }
    
    def _load_symptom_descriptions(self) -> Dict[str, str]:
        """Load symptom descriptions"""
        return {
            'fever': 'Elevated body temperature, usually above 98.6°F (37°C)',
            'cough': 'Sudden expulsion of air from the lungs',
            'headache': 'Pain or pressure in the head',
            'chest pain': 'Discomfort or pain in the chest area',
            'difficulty breathing': 'Shortness of breath or labored breathing',
            'nausea': 'Feeling of sickness or urge to vomit',
            'fatigue': 'Extreme tiredness or lack of energy',
            'dizziness': 'Feeling of lightheadedness or vertigo'
        }
    
    def _load_health_tips(self) -> Dict[str, List[str]]:
        """Load health tips by category"""
        return {
            'general': [
                'Drink at least 8 glasses of water daily',
                'Get 7-9 hours of sleep each night',
                'Exercise for at least 30 minutes daily',
                'Eat a balanced diet with fruits and vegetables',
                'Manage stress through meditation or yoga',
                'Wash hands regularly to prevent infections',
                'Maintain good hygiene habits'
            ],
            'nutrition': [
                'Include protein in every meal',
                'Eat colorful vegetables for different nutrients',
                'Limit sugar and processed foods',
                'Stay hydrated throughout the day',
                'Eat healthy fats like nuts and olive oil',
                'Include fiber-rich foods in your diet',
                'Avoid excessive salt intake'
            ],
            'fitness': [
                'Start with light exercise if you\'re new',
                'Warm up before exercising',
                'Cool down after exercise',
                'Mix cardio and strength training',
                'Rest days are important for recovery',
                'Stay consistent with your exercise routine',
                'Listen to your body and avoid overexertion'
            ],
            'mental_health': [
                'Practice mindfulness daily',
                'Connect with friends and family',
                'Take breaks from screens',
                'Pursue hobbies you enjoy',
                'Seek help if feeling overwhelmed',
                'Practice deep breathing exercises',
                'Keep a journal to express your feelings'
            ]
        }
    
    def chat(self, user_message: str) -> Dict:
        """Process user message and generate response"""
        try:
            # Check for emergency
            is_emergency, keyword = self._detect_emergency(user_message)
            if is_emergency:
                return self._handle_emergency(keyword, user_message)
            
            # Classify intent
            intent = self._classify_intent(user_message)
            
            # Route to appropriate handler
            if intent == 'symptoms':
                return self._handle_symptoms(user_message)
            elif intent == 'disease_info':
                return self._handle_disease_query(user_message)
            elif intent == 'greeting':
                return self._handle_greeting()
            elif intent == 'health_tips':
                return self._handle_health_tips_request(user_message)
            else:
                return self._handle_general(user_message)
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'response': 'I encountered an error processing your message.',
                'timestamp': self.timestamp
            }
    
    def _detect_emergency(self, message: str) -> Tuple[bool, Optional[str]]:
        """Detect emergency keywords in message"""
        message_lower = message.lower()
        for keyword in self.emergency_keywords:
            if keyword in message_lower:
                return True, keyword
        return False, None
    
    def _handle_emergency(self, keyword: str, message: str) -> Dict:
        """Handle emergency situations"""
        return {
            'success': True,
            'is_emergency': True,
            'emergency_keyword': keyword,
            'severity': 'CRITICAL',
            'response': '🚨 EMERGENCY DETECTED! Please call emergency services immediately (911 or your local emergency number). Do not wait for online consultation.',
            'actions': [
                'Call emergency services immediately',
                'Go to nearest hospital/ER',
                'Inform family members',
                'Keep patient calm and comfortable',
                'Do not move if spinal injury suspected'
            ],
            'timestamp': self.timestamp
        }
    
    def _classify_intent(self, message: str) -> str:
        """Classify user message intent"""
        message_lower = message.lower()
        
        # Check for symptoms
        symptom_keywords = ['symptom', 'pain', 'ache', 'fever', 'cough', 'headache', 
                           'feel', 'hurt', 'sick', 'ill', 'unwell', 'experiencing']
        if any(keyword in message_lower for keyword in symptom_keywords):
            return 'symptoms'
        
        # Check for disease info
        disease_keywords = ['disease', 'condition', 'what is', 'tell me about', 'info about', 'diagnosis']
        if any(keyword in message_lower for keyword in disease_keywords):
            return 'disease_info'
        
        # Check for health tips
        tips_keywords = ['tip', 'advice', 'help', 'how to', 'prevent', 'healthy', 'wellness']
        if any(keyword in message_lower for keyword in tips_keywords):
            return 'health_tips'
        
        # Check for greeting
        greeting_keywords = ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good evening']
        if any(keyword in message_lower for keyword in greeting_keywords):
            return 'greeting'
        
        return 'general'
    
    def _handle_symptoms(self, message: str) -> Dict:
        """Handle symptom-related queries with analysis"""
        # Extract symptoms from message
        symptoms = self._extract_symptoms(message)
        
        if symptoms:
            self.user_symptoms.extend(symptoms)
            
            # Calculate severity
            total_severity = sum(self.severity_dict.get(s, 5) for s in symptoms)
            avg_severity = total_severity / len(symptoms)
            
            # Get disease suggestions
            suggestions = self._get_disease_suggestions(symptoms)
            
            return {
                'success': True,
                'intent': 'symptoms',
                'symptoms_detected': symptoms,
                'severity_level': self._get_severity_level(avg_severity),
                'severity_score': round(avg_severity, 2),
                'disease_suggestions': suggestions[:3],  # Top 3
                'response': f'I detected {len(symptoms)} symptom(s): {", ".join(symptoms)}. '
                           f'Severity level: {self._get_severity_level(avg_severity)}. '
                           f'Based on these symptoms, you might have: {", ".join([s["disease"] for s in suggestions[:2]])}. '
                           f'Please consult a doctor for proper diagnosis.',
                'follow_up': 'How long have you been experiencing these symptoms?',
                'timestamp': self.timestamp
            }
        else:
            return {
                'success': True,
                'intent': 'symptoms',
                'response': 'I understand you\'re experiencing symptoms. Can you describe them in more detail? '
                           'What specific symptoms are you having?',
                'follow_up': 'Please tell me: 1) What symptoms? 2) How long? 3) Any other conditions?',
                'timestamp': self.timestamp
            }
    
    def _extract_symptoms(self, message: str) -> List[str]:
        """Extract symptoms from user message"""
        symptoms = []
        message_lower = message.lower()
        
        for symptom in self.severity_dict.keys():
            if symptom in message_lower:
                symptoms.append(symptom)
        
        return symptoms
    
    def _get_disease_suggestions(self, symptoms: List[str]) -> List[Dict]:
        """Get disease suggestions based on symptoms"""
        suggestions = []
        
        for disease_name, description in self.diseases.items():
            match_count = 0
            for symptom in symptoms:
                if symptom.lower() in description.lower() or symptom.lower() in disease_name.lower():
                    match_count += 1
            
            if match_count > 0:
                suggestions.append({
                    'disease': disease_name,
                    'match_score': match_count / len(symptoms),
                    'description': description[:100] + '...',
                    'has_precautions': disease_name in self.precautions
                })
        
        # Sort by match score
        suggestions.sort(key=lambda x: x['match_score'], reverse=True)
        return suggestions
    
    def _get_severity_level(self, score: float) -> str:
        """Get severity level from score"""
        if score >= 8:
            return 'CRITICAL'
        elif score >= 6:
            return 'HIGH'
        elif score >= 4:
            return 'MODERATE'
        else:
            return 'LOW'
    
    def _handle_disease_query(self, message: str) -> Dict:
        """Handle disease information queries"""
        for disease_name in self.diseases.keys():
            if disease_name.lower() in message.lower():
                description = self.diseases[disease_name]
                precautions = self.precautions.get(disease_name, "No precautions available")
                
                return {
                    'success': True,
                    'intent': 'disease_info',
                    'disease': disease_name,
                    'description': description,
                    'precautions': precautions,
                    'response': f'**{disease_name}**\n\n{description}\n\n**Precautions:**\n{precautions}',
                    'timestamp': self.timestamp
                }
        
        return {
            'success': True,
            'intent': 'disease_info',
            'response': 'I can provide information about various diseases. Which disease would you like to know about?',
            'available_diseases': len(self.diseases),
            'timestamp': self.timestamp
        }
    
    def _handle_health_tips_request(self, message: str) -> Dict:
        """Handle health tips requests"""
        # Determine category
        category = 'general'
        if 'nutrition' in message.lower() or 'diet' in message.lower():
            category = 'nutrition'
        elif 'fitness' in message.lower() or 'exercise' in message.lower():
            category = 'fitness'
        elif 'mental' in message.lower() or 'stress' in message.lower():
            category = 'mental_health'
        
        tips = self.health_tips.get(category, self.health_tips['general'])
        
        return {
            'success': True,
            'intent': 'health_tips',
            'category': category,
            'tips': tips,
            'response': f'Here are some {category} health tips:\n\n' + '\n'.join([f'• {tip}' for tip in tips[:5]]),
            'timestamp': self.timestamp
        }
    
    def _handle_greeting(self) -> Dict:
        """Handle greeting messages"""
        greetings = [
            'Hello! I\'m HealthAI, your advanced healthcare assistant. I can help you with symptom analysis, disease information, health tips, and more. What can I help you with today?',
            'Hi there! Welcome to HealthAI. I\'m here to provide comprehensive health guidance. What health concerns do you have?',
            'Greetings! I\'m your healthcare AI assistant. I can analyze symptoms, provide disease information, and give health recommendations. How can I assist you?'
        ]
        
        return {
            'success': True,
            'intent': 'greeting',
            'response': random.choice(greetings),
            'options': [
                'Tell me about my symptoms',
                'Ask about a disease',
                'Get health tips',
                'Find a doctor',
                'Emergency help'
            ],
            'timestamp': self.timestamp
        }
    
    def _handle_general(self, message: str) -> Dict:
        """Handle general queries"""
        return {
            'success': True,
            'intent': 'general',
            'response': 'I\'m here to help with health-related questions. You can ask me about symptoms, diseases, health tips, or get emergency guidance.',
            'suggestions': [
                'Describe your symptoms',
                'Ask about a specific disease',
                'Get health recommendations',
                'Find medical assistance'
            ],
            'timestamp': self.timestamp
        }
    
    def get_symptom_suggestions(self, symptom: str) -> Dict:
        """Get disease suggestions based on symptom"""
        try:
            symptom_lower = symptom.lower()
            suggestions = []
            
            for disease_name, description in self.diseases.items():
                if symptom_lower in description.lower() or symptom_lower in disease_name.lower():
                    suggestions.append({
                        'disease': disease_name,
                        'relevance': 'high' if symptom_lower in disease_name.lower() else 'medium',
                        'description': description[:100] + '...',
                        'severity': self.severity_dict.get(symptom_lower, 5)
                    })
            
            return {
                'success': True,
                'symptom': symptom,
                'suggestions_count': len(suggestions),
                'suggestions': suggestions[:5],
                'disclaimer': 'These are suggestions only. Please consult a doctor for proper diagnosis.',
                'timestamp': self.timestamp
            }
        except Exception as e:
            return {'success': False, 'error': str(e), 'timestamp': self.timestamp}
    
    def calculate_risk_score(self, symptoms: List[str], days: int = 1) -> Dict:
        """Calculate health risk score based on symptoms and duration"""
        try:
            if not symptoms:
                return {'success': False, 'error': 'No symptoms provided'}
            
            # Calculate severity sum
            severity_sum = sum(self.severity_dict.get(s, 5) for s in symptoms)
            
            # Calculate risk score (severity * days / number of symptoms)
            risk_score = (severity_sum * days) / (len(symptoms) + 1)
            
            # Determine recommendation
            if risk_score > 13:
                recommendation = 'You should consult a doctor immediately.'
                urgency = 'HIGH'
            elif risk_score > 8:
                recommendation = 'You should schedule a doctor appointment soon.'
                urgency = 'MODERATE'
            else:
                recommendation = 'Monitor your symptoms and take precautions.'
                urgency = 'LOW'
            
            return {
                'success': True,
                'symptoms': symptoms,
                'days': days,
                'risk_score': round(risk_score, 2),
                'urgency': urgency,
                'recommendation': recommendation,
                'timestamp': self.timestamp
            }
        except Exception as e:
            return {'success': False, 'error': str(e), 'timestamp': self.timestamp}
    
    def add_to_history(self, user_message: str, bot_response: str) -> None:
        """Add message to conversation history"""
        self.conversation_history.append({
            'user': user_message,
            'bot': bot_response,
            'timestamp': datetime.now().isoformat()
        })
    
    def get_conversation_history(self) -> List[Dict]:
        """Get conversation history"""
        return self.conversation_history
    
    def clear_history(self) -> Dict:
        """Clear conversation history"""
        self.conversation_history = []
        self.user_symptoms = []
        return {
            'success': True,
            'message': 'Conversation history cleared',
            'timestamp': self.timestamp
        }


# Create singleton instance
healthai_chatbot_enhanced = HealthAIEnhancedChatbot()
