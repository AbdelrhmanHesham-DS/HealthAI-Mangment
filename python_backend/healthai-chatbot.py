"""
HealthAI Chatbot Service
Conversational healthcare chatbot with symptom analysis and guidance
"""

import json
import os
import random
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import csv

# Import disease data
from ai.features.doctor_assistant.doctor_disease_descriptions import diesis_desc
from ai.features.doctor_assistant.doctor_symptom_precautions import diesis_prec


class HealthAIChatbot:
    """Conversational healthcare chatbot"""
    
    def __init__(self):
        self.diseases = diesis_desc
        self.precautions = diesis_prec
        self.timestamp = datetime.now().isoformat()
        self.conversation_history = []
        self.intents = self._load_intents()
        self.emergency_keywords = [
            'chest pain', 'difficulty breathing', 'severe bleeding', 'unconscious',
            'poisoning', 'severe allergic', 'stroke', 'heart attack', 'emergency',
            'ambulance', 'critical', 'severe', 'urgent'
        ]
        
    def _load_intents(self) -> Dict:
        """Load chatbot intents from JSON file"""
        try:
            intents_path = os.path.join(os.path.dirname(__file__), 'ai/features/chatbot/intents.json')
            if os.path.exists(intents_path):
                with open(intents_path, 'r') as f:
                    return json.load(f)
        except Exception as e:
            print(f"Could not load intents: {e}")
        
        return {
            'greetings': ['Hello', 'Hi', 'Hey', 'Greetings'],
            'symptoms': ['symptom', 'pain', 'ache', 'fever', 'cough', 'headache'],
            'help': ['help', 'assist', 'support', 'guide', 'advice']
        }
    
    def chat(self, user_message: str) -> Dict:
        """Process user message and generate response"""
        try:
            is_emergency, keyword = self._detect_emergency(user_message)
            if is_emergency:
                return self._handle_emergency(keyword, user_message)
            
            intent = self._classify_intent(user_message)
            
            if intent == 'symptoms':
                return self._handle_symptoms(user_message)
            elif intent == 'disease_info':
                return self._handle_disease_query(user_message)
            elif intent == 'greeting':
                return self._handle_greeting()
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
            'response': '🚨 EMERGENCY DETECTED! Please call emergency services immediately (911 or your local emergency number). Do not wait for online consultation.',
            'actions': [
                'Call emergency services',
                'Go to nearest hospital',
                'Inform family members',
                'Keep patient calm'
            ],
            'timestamp': self.timestamp
        }
    
    def _classify_intent(self, message: str) -> str:
        """Classify user message intent"""
        message_lower = message.lower()
        
        symptom_keywords = ['symptom', 'pain', 'ache', 'fever', 'cough', 'headache', 'feel', 'hurt', 'sick']
        if any(keyword in message_lower for keyword in symptom_keywords):
            return 'symptoms'
        
        disease_keywords = ['disease', 'condition', 'what is', 'tell me about', 'info about']
        if any(keyword in message_lower for keyword in disease_keywords):
            return 'disease_info'
        
        greeting_keywords = ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good evening']
        if any(keyword in message_lower for keyword in greeting_keywords):
            return 'greeting'
        
        return 'general'
    
    def _handle_symptoms(self, message: str) -> Dict:
        """Handle symptom-related queries"""
        return {
            'success': True,
            'intent': 'symptoms',
            'response': 'I understand you\'re experiencing symptoms. Can you describe them in more detail? What specific symptoms are you having?',
            'follow_up': 'Please tell me: 1) What symptoms? 2) How long? 3) Any other conditions?',
            'recommendation': 'Based on your symptoms, I can help suggest possible conditions, but please consult a doctor for proper diagnosis.',
            'timestamp': self.timestamp
        }
    
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
                    'response': f'Here\'s information about {disease_name}: {description[:150]}...',
                    'timestamp': self.timestamp
                }
        
        return {
            'success': True,
            'intent': 'disease_info',
            'response': 'I can provide information about various diseases. Which disease would you like to know about?',
            'available_diseases': len(self.diseases),
            'timestamp': self.timestamp
        }
    
    def _handle_greeting(self) -> Dict:
        """Handle greeting messages"""
        greetings = [
            'Hello! I\'m HealthAI, your healthcare assistant. How can I help you today?',
            'Hi there! Welcome to HealthAI. What health concerns do you have?',
            'Greetings! I\'m here to provide health guidance. What brings you here?'
        ]
        
        return {
            'success': True,
            'intent': 'greeting',
            'response': random.choice(greetings),
            'options': [
                'Tell me about symptoms',
                'Ask about a disease',
                'Get health tips',
                'Find a doctor'
            ],
            'timestamp': self.timestamp
        }
    
    def _handle_general(self, message: str) -> Dict:
        """Handle general queries"""
        return {
            'success': True,
            'intent': 'general',
            'response': 'I\'m here to help with health-related questions. You can ask me about symptoms, diseases, precautions, or health tips.',
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
                        'description': description[:100] + '...'
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
    
    def get_health_tips(self, category: str = None) -> Dict:
        """Get health tips"""
        tips = {
            'general': [
                'Drink at least 8 glasses of water daily',
                'Get 7-9 hours of sleep each night',
                'Exercise for at least 30 minutes daily',
                'Eat a balanced diet with fruits and vegetables',
                'Manage stress through meditation or yoga'
            ],
            'nutrition': [
                'Include protein in every meal',
                'Eat colorful vegetables for different nutrients',
                'Limit sugar and processed foods',
                'Stay hydrated throughout the day',
                'Eat healthy fats like nuts and olive oil'
            ],
            'fitness': [
                'Start with light exercise if you\'re new',
                'Warm up before exercising',
                'Cool down after exercise',
                'Mix cardio and strength training',
                'Rest days are important for recovery'
            ],
            'mental_health': [
                'Practice mindfulness daily',
                'Connect with friends and family',
                'Take breaks from screens',
                'Pursue hobbies you enjoy',
                'Seek help if feeling overwhelmed'
            ]
        }
        
        if category and category in tips:
            return {
                'success': True,
                'category': category,
                'tips': tips[category],
                'timestamp': self.timestamp
            }
        
        all_tips = []
        for cat, tip_list in tips.items():
            all_tips.extend(tip_list)
        
        return {
            'success': True,
            'category': 'all',
            'tips': all_tips,
            'timestamp': self.timestamp
        }
    
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
        return {
            'success': True,
            'message': 'Conversation history cleared',
            'timestamp': self.timestamp
        }


# Create singleton instance
healthai_chatbot = HealthAIChatbot()
