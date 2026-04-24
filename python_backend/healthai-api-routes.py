"""
HealthAI API Routes - All Healthcare Features
Complete API endpoints for Doctor Assistant, Chatbot, and HealthAI Core
"""

from flask import Blueprint, request, jsonify
from healthai_doctor_assistant import doctor_assistant
from healthai_chatbot import healthai_chatbot
from advanced_ai_chatbot import advanced_chatbot
from ai.services.healthai_analyzer import healthai_analyzer

# Create blueprints
doctor_bp = Blueprint('doctor', __name__, url_prefix='/api/doctor')
chatbot_bp = Blueprint('chatbot', __name__, url_prefix='/api/chatbot')
healthai_bp = Blueprint('healthai', __name__, url_prefix='/api/healthai')

# ============================================================================
# DOCTOR ASSISTANT ENDPOINTS (8)
# ============================================================================

@doctor_bp.route('/disease/info', methods=['POST'])
def get_disease_info():
    """Get detailed information about a disease"""
    try:
        data = request.get_json()
        disease_name = data.get('disease_name')
        
        if not disease_name:
            return jsonify({'error': 'Disease name is required'}), 400
        
        result = doctor_assistant.get_disease_info(disease_name)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@doctor_bp.route('/disease/precautions', methods=['POST'])
def get_precautions():
    """Get precautions for a disease"""
    try:
        data = request.get_json()
        disease_name = data.get('disease_name')
        
        if not disease_name:
            return jsonify({'error': 'Disease name is required'}), 400
        
        result = doctor_assistant.get_precautions(disease_name)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@doctor_bp.route('/disease/search', methods=['POST'])
def search_diseases():
    """Search for diseases by keyword"""
    try:
        data = request.get_json()
        keyword = data.get('keyword')
        
        if not keyword:
            return jsonify({'error': 'Search keyword is required'}), 400
        
        result = doctor_assistant.search_diseases(keyword)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@doctor_bp.route('/disease/list', methods=['GET'])
def get_all_diseases():
    """Get list of all diseases"""
    try:
        result = doctor_assistant.get_all_diseases()
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@doctor_bp.route('/disease/summary', methods=['POST'])
def get_disease_summary():
    """Get quick summary of a disease"""
    try:
        data = request.get_json()
        disease_name = data.get('disease_name')
        
        if not disease_name:
            return jsonify({'error': 'Disease name is required'}), 400
        
        result = doctor_assistant.get_disease_summary(disease_name)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@doctor_bp.route('/disease/compare', methods=['POST'])
def compare_diseases():
    """Compare multiple diseases"""
    try:
        data = request.get_json()
        disease_names = data.get('disease_names', [])
        
        if not disease_names:
            return jsonify({'error': 'Disease names list is required'}), 400
        
        result = doctor_assistant.compare_diseases(disease_names)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@doctor_bp.route('/stats', methods=['GET'])
def get_stats():
    """Get doctor assistant statistics"""
    try:
        result = doctor_assistant.get_doctor_stats()
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@doctor_bp.route('/status', methods=['GET'])
def get_status():
    """Get doctor assistant service status"""
    try:
        stats = doctor_assistant.get_doctor_stats()
        return jsonify({
            'status': 'operational',
            'service': 'HealthAI Doctor Assistant',
            'version': '1.0',
            'total_diseases': stats['total_diseases'],
            'diseases_with_precautions': stats['diseases_with_precautions'],
            'coverage': f"{stats['coverage_percentage']}%"
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# CHATBOT ENDPOINTS (6)
# ============================================================================

@chatbot_bp.route('/message', methods=['POST'])
def chat_message():
    """Send message to chatbot and get response using advanced AI engine"""
    try:
        data = request.get_json()
        user_message = data.get('message')
        user_id = data.get('user_id')
        
        if not user_message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Use advanced AI chatbot with all datasets
        result = advanced_chatbot.chat(user_message, user_id)
        
        if result.get('success'):
            response_text = result.get('response', '')
            advanced_chatbot.add_to_history(user_message, response_text)
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@chatbot_bp.route('/symptoms/suggest', methods=['POST'])
def get_symptom_suggestions():
    """Get disease suggestions based on symptom"""
    try:
        data = request.get_json()
        symptom = data.get('symptom')
        
        if not symptom:
            return jsonify({'error': 'Symptom is required'}), 400
        
        result = healthai_chatbot.get_symptom_suggestions(symptom)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@chatbot_bp.route('/tips', methods=['POST'])
def get_health_tips():
    """Get health tips by category"""
    try:
        data = request.get_json()
        category = data.get('category')
        
        result = healthai_chatbot.get_health_tips(category)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@chatbot_bp.route('/history', methods=['GET'])
def get_history():
    """Get conversation history"""
    try:
        history = healthai_chatbot.get_conversation_history()
        return jsonify({
            'success': True,
            'history_count': len(history),
            'history': history
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@chatbot_bp.route('/history/clear', methods=['POST'])
def clear_history():
    """Clear conversation history"""
    try:
        result = healthai_chatbot.clear_history()
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@chatbot_bp.route('/status', methods=['GET'])
def get_status():
    """Get chatbot service status"""
    try:
        history = healthai_chatbot.get_conversation_history()
        return jsonify({
            'status': 'operational',
            'service': 'HealthAI Chatbot',
            'version': '1.0',
            'conversation_count': len(history),
            'features': [
                'Symptom Analysis',
                'Disease Information',
                'Health Tips',
                'Emergency Detection',
                'Conversation History'
            ]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# HEALTHAI CORE ENDPOINTS (11)
# ============================================================================

@healthai_bp.route('/symptoms/analyze', methods=['POST'])
def analyze_symptoms():
    """Analyze patient symptoms and suggest possible conditions"""
    try:
        data = request.get_json()
        symptoms = data.get('symptoms', [])
        age = data.get('age')
        gender = data.get('gender')
        
        if not symptoms:
            return jsonify({'error': 'Symptoms list is required'}), 400
        
        result = healthai_analyzer.analyze_symptoms(symptoms, age, gender)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@healthai_bp.route('/diagnosis/predict', methods=['POST'])
def predict_diagnosis():
    """Predict possible diagnoses based on symptoms"""
    try:
        data = request.get_json()
        symptoms = data.get('symptoms', [])
        medical_history = data.get('medical_history')
        
        if not symptoms:
            return jsonify({'error': 'Symptoms list is required'}), 400
        
        result = healthai_analyzer.predict_diagnosis(symptoms, medical_history)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@healthai_bp.route('/lab-results/analyze', methods=['POST'])
def analyze_lab_results():
    """Analyze laboratory test results"""
    try:
        data = request.get_json()
        test_results = data.get('test_results', {})
        
        if not test_results:
            return jsonify({'error': 'Test results are required'}), 400
        
        result = healthai_analyzer.analyze_lab_results(test_results)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@healthai_bp.route('/emergency/guidance', methods=['POST'])
def get_emergency_guidance():
    """Get emergency first aid guidance"""
    try:
        data = request.get_json()
        emergency = data.get('emergency')
        
        if not emergency:
            return jsonify({'error': 'Emergency description is required'}), 400
        
        result = healthai_analyzer.get_emergency_guidance(emergency)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@healthai_bp.route('/medications/review', methods=['POST'])
def review_medications():
    """Review medications for interactions and side effects"""
    try:
        data = request.get_json()
        medications = data.get('medications', [])
        
        if not medications:
            return jsonify({'error': 'Medications list is required'}), 400
        
        result = healthai_analyzer.review_medications(medications)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@healthai_bp.route('/health-metrics/analyze', methods=['POST'])
def analyze_health_metrics():
    """Analyze health metrics and provide recommendations"""
    try:
        data = request.get_json()
        health_metrics = data.get('health_metrics', {})
        
        if not health_metrics:
            return jsonify({'error': 'Health metrics are required'}), 400
        
        result = healthai_analyzer.analyze_health_metrics(health_metrics)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@healthai_bp.route('/doctor/recommend', methods=['POST'])
def recommend_doctor():
    """Recommend appropriate doctor based on patient needs"""
    try:
        data = request.get_json()
        patient_need = data.get('patient_need')
        available_doctors = data.get('available_doctors')
        
        if not patient_need:
            return jsonify({'error': 'Patient need is required'}), 400
        
        result = healthai_analyzer.recommend_doctor(patient_need, available_doctors)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@healthai_bp.route('/tips/get', methods=['POST'])
def get_health_tips():
    """Get personalized health tips"""
    try:
        data = request.get_json()
        category = data.get('category')
        
        result = healthai_analyzer.get_health_tips(category)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@healthai_bp.route('/emergency/detect', methods=['POST'])
def detect_emergency():
    """Detect emergency keywords in message"""
    try:
        data = request.get_json()
        message = data.get('message')
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        is_emergency, keyword = healthai_analyzer.detect_emergency(message)
        
        return jsonify({
            'is_emergency': is_emergency,
            'keyword': keyword,
            'message': message,
            'timestamp': healthai_analyzer.get_all_features()['timestamp']
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@healthai_bp.route('/features', methods=['GET'])
def get_all_features():
    """Get list of all available HealthAI features"""
    result = healthai_analyzer.get_all_features()
    return jsonify(result), 200

@healthai_bp.route('/status', methods=['GET'])
def get_status():
    """Get HealthAI service status"""
    features = healthai_analyzer.get_all_features()
    return jsonify({
        'status': 'operational',
        'service': 'HealthAI Healthcare Analysis Platform',
        'version': '1.0',
        'total_features': features['total_features'],
        'ai_models': features['ai_models'],
        'timestamp': features['timestamp']
    }), 200
