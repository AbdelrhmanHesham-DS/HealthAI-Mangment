"""
Chatbot Service - Advanced AI-powered healthcare assistant
Similar to ChatGPT/Gemini but specialized for healthcare platform
"""
import os
import re
from datetime import datetime
import json

def get_openai_client():
    """Get OpenAI client (lazy load)"""
    from openai import OpenAI
    return OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

class ChatbotService:
    """Advanced service for managing AI chatbot conversations with security"""
    
    def __init__(self):
        self.model = "gpt-4-turbo"
        self.temperature = 0.8  # Higher temperature for more natural, varied responses
        self.max_tokens = 500  # Lower max tokens to force shorter responses
        
        # Security patterns to block malicious inputs
        self.malicious_patterns = [
            r'(?i)(sql|injection|drop|delete|update|insert)',
            r'(?i)(script|javascript|eval|exec)',
            r'(?i)(password|token|secret|api_key)',
            r'(?i)(admin|root|sudo|chmod)',
            r'(?i)(rm\s+-rf|format|wipe)',
            r'(?i)(union|select|where|from)',
            r'(?i)(hack|crack|bypass|exploit)',
        ]
        
        # Healthcare keywords for context validation
        self.healthcare_keywords = [
            'doctor', 'appointment', 'symptom', 'disease', 'treatment',
            'prescription', 'medication', 'health', 'patient', 'hospital',
            'clinic', 'diagnosis', 'medical', 'nurse', 'specialist',
            'consultation', 'record', 'test', 'lab', 'vaccine',
            'emergency', 'urgent', 'pain', 'fever', 'cough', 'platform',
            'book', 'schedule', 'profile', 'dashboard', 'account'
        ]
    
    def _is_malicious(self, message: str) -> bool:
        """Check if message contains malicious patterns"""
        for pattern in self.malicious_patterns:
            if re.search(pattern, message):
                return True
        return False
    
    def _is_healthcare_related(self, message: str) -> bool:
        """Check if message is related to healthcare or platform"""
        message_lower = message.lower()
        
        # Check for healthcare keywords
        for keyword in self.healthcare_keywords:
            if keyword in message_lower:
                return True
        
        # Allow general greetings and help requests
        general_patterns = [
            r'(?i)(hello|hi|hey|help|what can you do)',
            r'(?i)(who are you|what are you)',
            r'(?i)(how do i|how can i)',
        ]
        
        for pattern in general_patterns:
            if re.search(pattern, message):
                return True
        
        return False
    
    def send_message(self, user_message: str, conversation_history: list = None, patient_context: dict = None) -> dict:
        """
        Send a message to the AI chatbot and get a response
        
        Args:
            user_message: The user's message
            conversation_history: Previous messages in the conversation
            patient_context: Optional patient health context
            
        Returns:
            dict with response, metadata, and safety checks
        """
        try:
            # Security check - block malicious inputs
            if self._is_malicious(user_message):
                return {
                    'response': '⚠️ I cannot process that request. Please ask something related to your health or our platform.',
                    'type': 'security_blocked',
                    'timestamp': datetime.now().isoformat(),
                    'safety_triggered': True,
                    'reason': 'Malicious input detected'
                }
            
            # Check if healthcare related
            if not self._is_healthcare_related(user_message):
                return {
                    'response': "I don't understand that question. 🤔\n\nI'm MediAI, your healthcare assistant. I can help you with:\n• 🏥 Booking appointments\n• 👨‍⚕️ Finding doctors and specialists\n• 🩺 Health information and symptoms\n• 📋 Your medical records\n• 💊 Medication information\n• 🏥 Hospital and clinic information\n\nCould you please ask something related to your health or our platform?",
                    'type': 'out_of_scope',
                    'timestamp': datetime.now().isoformat(),
                    'safety_triggered': False
                }
            
            client = get_openai_client()
            
            # Build system prompt with safety guidelines
            system_prompt = self._build_system_prompt(patient_context)
            
            # Check for emergency keywords
            emergency_check = self._check_emergency_keywords(user_message)
            if emergency_check['is_emergency']:
                return {
                    'response': emergency_check['message'],
                    'type': 'emergency',
                    'timestamp': datetime.now().isoformat(),
                    'safety_triggered': True
                }
            
            # Build messages for API call
            messages = [{'role': 'system', 'content': system_prompt}]
            
            if conversation_history:
                # Keep last 10 messages for context
                messages.extend(conversation_history[-10:])
            
            messages.append({'role': 'user', 'content': user_message})
            
            # Call OpenAI API
            response = client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                top_p=0.85,  # Reduced for more focused responses
                frequency_penalty=0.8,  # Higher to avoid repetition
                presence_penalty=0.6  # Higher to encourage new topics
            )
            
            ai_response = response.choices[0].message.content
            
            # Check for harmful content in response
            safety_check = self._check_harmful_content(ai_response)
            if safety_check['is_harmful']:
                return {
                    'response': '⚠️ I cannot provide that information. Please consult with a qualified healthcare professional.',
                    'type': 'safety_blocked',
                    'timestamp': datetime.now().isoformat(),
                    'safety_triggered': True,
                    'reason': safety_check['reason']
                }
            
            # Add medical disclaimer
            response_with_disclaimer = self._add_medical_disclaimer(ai_response)
            
            return {
                'response': response_with_disclaimer,
                'type': 'medical_guidance',
                'timestamp': datetime.now().isoformat(),
                'safety_triggered': False,
                'tokens_used': response.usage.total_tokens,
                'model': self.model
            }
            
        except Exception as e:
            return {
                'response': '❌ An error occurred while processing your request. Please try again.',
                'type': 'error',
                'timestamp': datetime.now().isoformat(),
                'error': str(e)
            }
    
    def _build_system_prompt(self, patient_context: dict = None) -> str:
        """Build the system prompt with patient context and safety guidelines"""
        base_prompt = """You are MediAI, an advanced healthcare assistant for the HealthAI platform - similar to ChatGPT but specialized for healthcare.

YOUR ROLE:
- Have natural, conversational dialogue with users
- Ask clarifying questions to understand what users need
- Provide helpful health information and guidance
- Help patients understand their symptoms through conversation
- Answer questions about the HealthAI platform
- Provide wellness and preventive care advice
- Support patients in managing their health

CONVERSATION STYLE (Like ChatGPT - VERY IMPORTANT):
✓ Keep responses SHORT and natural - 1-3 sentences usually
✓ Ask ONE clarifying question at a time, not multiple
✓ Be conversational and casual, not formal or structured
✓ Don't use bullet points unless absolutely necessary
✓ Don't give long lists or structured responses
✓ Listen to what the user is saying and respond appropriately
✓ Don't jump to conclusions or suggest doctors immediately
✓ Have a real dialogue, like texting a friend
✓ Be empathetic and understanding
✓ Use a friendly, approachable tone
✓ Only provide detailed information when the user asks for it

IMPORTANT SAFETY GUIDELINES:
✓ ALWAYS be empathetic and professional
✓ ALWAYS recommend consulting a healthcare professional for serious conditions
✓ NEVER provide definitive diagnoses - suggest consulting doctors only when appropriate
✓ NEVER prescribe medications - only provide general information
✓ NEVER provide emergency medical advice - direct to emergency services
✓ ALWAYS include appropriate medical disclaimers when giving medical advice
✓ ALWAYS acknowledge limitations in your knowledge
✓ NEVER provide mental health crisis intervention - direct to crisis hotlines
✓ ALWAYS be honest about what you don't know

RESPONSE GUIDELINES:
- Keep it SHORT and conversational
- Use emojis sparingly (1-2 max per message)
- Ask one question at a time
- Don't over-explain or be too formal
- Be natural and conversational
- Only suggest doctors/specialists when the user actually needs medical help
- Let the conversation flow naturally

PLATFORM FEATURES YOU CAN HELP WITH:
- 🏥 Booking appointments with doctors
- 👨‍⚕️ Finding specialists by symptoms
- 📋 Understanding medical records
- 💪 Health tracking and monitoring
- 💊 Medication information
- 🏥 Hospital and clinic information
- 🎯 General health tips and wellness
- 🔐 Account and profile management

IMPORTANT - CONVERSATION EXAMPLES (SHORT AND NATURAL):

User: "I want to ask about something"
You: "Of course! What's on your mind?"

User: "I have a headache"
You: "Sorry to hear that. How long have you had it?"

User: "I'm feeling tired"
You: "That's rough. How long has this been going on?"

User: "I have chest pain"
You: "🚨 This could be serious. Are you having difficulty breathing or any other symptoms right now?"

User: "I have a cough"
You: "How long have you had the cough? Is it dry or do you have phlegm?"

REMEMBER: Keep responses SHORT, natural, and conversational. Ask ONE question at a time. Don't give structured lists unless asked. Be like ChatGPT - natural dialogue, not a medical form."""
        
        if patient_context:
            base_prompt += f"\n\nPATIENT CONTEXT:\n"
            if patient_context.get('demographics'):
                base_prompt += f"- Age: {patient_context['demographics'].get('age')}\n"
                base_prompt += f"- Gender: {patient_context['demographics'].get('gender')}\n"
            
            if patient_context.get('recent_metrics'):
                base_prompt += f"\nRecent Health Metrics:\n"
                for metric in patient_context['recent_metrics'][:5]:
                    base_prompt += f"  • {metric.get('type')}: {metric.get('value')} {metric.get('unit')}\n"
            
            if patient_context.get('medical_history'):
                base_prompt += f"\nMedical History:\n"
                for condition in patient_context['medical_history'][:3]:
                    base_prompt += f"  • {condition}\n"
        
        return base_prompt
    
    def _check_emergency_keywords(self, message: str) -> dict:
        """Check for emergency keywords in user message"""
        emergency_keywords = [
            "can't breathe", "chest pain", "unconscious", "severe bleeding",
            "choking", "poisoning", "overdose", "severe allergic reaction",
            "stroke", "heart attack", "difficulty breathing", "loss of consciousness",
            "severe injury", "uncontrolled bleeding", "difficulty swallowing"
        ]
        
        message_lower = message.lower()
        for keyword in emergency_keywords:
            if keyword in message_lower:
                return {
                    'is_emergency': True,
                    'message': f"🚨 EMERGENCY DETECTED\n\n**{keyword.upper()}**\n\nPlease call emergency services immediately:\n• 🇺🇸 USA: 911\n• 🇬🇧 UK: 999\n• 🇪🇺 EU: 112\n\nOr go to the nearest emergency room.\n\n⚠️ Do not wait for online consultation in emergency situations."
                }
        
        return {'is_emergency': False}
    
    def _check_harmful_content(self, response: str) -> dict:
        """Check for potentially harmful content in AI response"""
        harmful_patterns = [
            r"(?i)(stop taking|discontinue medication|replace your medication)",
            r"(?i)(this will cure|guaranteed to work|100% effective)",
            r"(?i)(instead of going to doctor|don't need to see a doctor)",
        ]
        
        response_lower = response.lower()
        for pattern in harmful_patterns:
            if re.search(pattern, response_lower):
                return {
                    'is_harmful': True,
                    'reason': 'Response contains potentially harmful advice'
                }
        
        return {'is_harmful': False}
    
    def _add_medical_disclaimer(self, response: str) -> str:
        """Add medical disclaimer to response"""
        disclaimer = "\n\n---\n⚠️ **MEDICAL DISCLAIMER**: This information is for educational purposes only and should not be considered medical advice. Always consult with a qualified healthcare professional before making any medical decisions."
        return response + disclaimer
    
    def analyze_symptoms(self, symptoms: list) -> dict:
        """
        Analyze symptoms and suggest relevant medical specialties
        
        Args:
            symptoms: List of symptoms described by patient
            
        Returns:
            dict with suggested specialties and recommendations
        """
        try:
            client = get_openai_client()
            symptoms_text = ", ".join(symptoms)
            
            prompt = f"""Based on these symptoms: {symptoms_text}
            
Please provide:
1. **Possible Medical Specialties** (2-3 relevant specialists)
2. **General Information** about these conditions (NOT a diagnosis)
3. **When to Seek Immediate Care** (emergency signs)
4. **Recommended Next Steps** (how to proceed)

⚠️ Remember: This is NOT a diagnosis. Patient should consult with a healthcare professional."""
            
            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {'role': 'system', 'content': 'You are a medical information assistant. Provide helpful health information without diagnosing. Always recommend professional consultation.'},
                    {'role': 'user', 'content': prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            analysis = response.choices[0].message.content + "\n\n---\n⚠️ **DISCLAIMER**: This is general information only, not a medical diagnosis. Please consult with a healthcare professional."
            
            return {
                'analysis': analysis,
                'symptoms': symptoms,
                'timestamp': datetime.now().isoformat(),
                'success': True
            }
            
        except Exception as e:
            return {
                'error': str(e),
                'symptoms': symptoms,
                'success': False
            }

# Create singleton instance
chatbot_service = ChatbotService()
