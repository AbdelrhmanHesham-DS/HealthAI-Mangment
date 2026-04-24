"""
Comprehensive AI Routes - All 25 Projects Integrated
Complete API endpoints for all healthcare AI features
"""
from flask import Blueprint, request, jsonify
from services.comprehensive_ai_service import comprehensive_ai_service

comp_ai_bp = Blueprint('comprehensive_ai', __name__, url_prefix='/api/ai/v2')

# ========== 1. SYMPTOM ANALYSIS ==========
@comp_ai_bp.route('/symptoms/analyze', methods=['POST'])
def analyze_symptoms():
    """Analyze symptoms and suggest possible conditions"""
    try:
        data = request.get_json()
        symptoms = data.get('symptoms', [])
        age = data.get('age')
        gender = data.get('gender')
        
        if not symptoms:
            return jsonify({'error': 'Symptoms list is required'}), 400
        
        result = comprehensive_ai_service.analyze_symptoms(symptoms, age, gender)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ========== 2. DISEASE PREDICTION ==========
@comp_ai_bp.route('/disease/predict', methods=['POST'])
def predict_disease():
    """Predict diseases based on symptoms"""
    try:
        data = request.get_json()
        symptoms = data.get('symptoms', [])
        medical_history = data.get('medical_history')
        
        if not symptoms:
            return jsonify({'error': 'Symptoms list is required'}), 400
        
        result = comprehensive_ai_service.predict_disease(symptoms, medical_history)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ========== 3. BLOOD TEST ANALYSIS ==========
@comp_ai_bp.route('/blood-test/analyze', methods=['POST'])
def analyze_blood_test():
    """Analyze blood test results"""
    try:
        data = request.get_json()
        test_results = data.get('test_results', {})
        
        if not test_results:
            return jsonify({'error': 'Test results are required'}), 400
        
        result = comprehensive_ai_service.analyze_blood_test(test_results)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ========== 4. FIRST AID GUIDANCE ==========
@comp_ai_bp.route('/first-aid/guidance', methods=['POST'])
def first_aid_guidance():
    """Get first aid guidance for emergencies"""
    try:
        data = request.get_json()
        emergency = data.get('emergency')
        
        if not emergency:
            return jsonify({'error': 'Emergency description is required'}), 400
        
        result = comprehensive_ai_service.get_first_aid_guidance(emergency)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ========== 5. MEDICATION ANALYSIS ==========
@comp_ai_bp.route('/medications/analyze', methods=['POST'])
def analyze_medications():
    """Analyze medications for interactions and side effects"""
    try:
        data = request.get_json()
        medications = data.get('medications', [])
        
        if not medications:
            return jsonify({'error': 'Medications list is required'}), 400
        
        result = comprehensive_ai_service.analyze_medications(medications)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ========== 6. HEALTH MONITORING ==========
@comp_ai_bp.route('/health/monitor', methods=['POST'])
def health_monitoring():
    """Analyze health metrics and provide monitoring recommendations"""
    try:
        data = request.get_json()
        health_metrics = data.get('health_metrics', {})
        
        if not health_metrics:
            return jsonify({'error': 'Health metrics are required'}), 400
        
        result = comprehensive_ai_service.analyze_health_metrics(health_metrics)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ========== 7. APPOINTMENT BOOKING ==========
@comp_ai_bp.route('/appointment/assist', methods=['POST'])
def appointment_assist():
    """AI assistant for appointment scheduling"""
    try:
        data = request.get_json()
        request_text = data.get('request')
        available_doctors = data.get('available_doctors')
        
        if not request_text:
            return jsonify({'error': 'Appointment request is required'}), 400
        
        result = comprehensive_ai_service.assist_appointment_booking(request_text, available_doctors)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ========== 8. DOCTOR SEARCH ==========
@comp_ai_bp.route('/doctors/search', methods=['POST'])
def search_doctors():
    """Search for doctors by specialty and location"""
    try:
        data = request.get_json()
        specialty = data.get('specialty')
        location = data.get('location')
        availability = data.get('availability')
        
        if not specialty:
            return jsonify({'error': 'Specialty is required'}), 400
        
        result = comprehensive_ai_service.search_doctors(specialty, location, availability)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ========== 9. HOSPITAL SEARCH ==========
@comp_ai_bp.route('/hospitals/search', methods=['POST'])
def search_hospitals():
    """Search for hospitals by city and services"""
    try:
        data = request.get_json()
        city = data.get('city')
        services = data.get('services')
        
        if not city:
            return jsonify({'error': 'City is required'}), 400
        
        result = comprehensive_ai_service.search_hospitals(city, services)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ========== 10. MEDICAL Q&A ==========
@comp_ai_bp.route('/qa/medical', methods=['POST'])
def medical_qa():
    """Answer medical questions"""
    try:
        data = request.get_json()
        question = data.get('question')
        
        if not question:
            return jsonify({'error': 'Question is required'}), 400
        
        result = comprehensive_ai_service.medical_qa(question)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ========== 11. EMERGENCY DETECTION ==========
@comp_ai_bp.route('/emergency/detect', methods=['POST'])
def detect_emergency():
    """Detect emergency keywords in message"""
    try:
        data = request.get_json()
        message = data.get('message')
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        is_emergency, keyword = comprehensive_ai_service.detect_emergency(message)
        
        return jsonify({
            'is_emergency': is_emergency,
            'keyword': keyword,
            'message': message,
            'timestamp': comprehensive_ai_service.get_all_features()['timestamp']
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ========== 12. HEALTH TIPS ==========
@comp_ai_bp.route('/tips/health', methods=['POST'])
def get_health_tips():
    """Get personalized health tips"""
    try:
        data = request.get_json()
        category = data.get('category')
        
        result = comprehensive_ai_service.get_health_tips(category)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ========== 13. GET ALL FEATURES ==========
@comp_ai_bp.route('/features', methods=['GET'])
def get_all_features():
    """Get list of all available AI features"""
    result = comprehensive_ai_service.get_all_features()
    return jsonify(result), 200

# ========== 14. FEATURE STATUS ==========
@comp_ai_bp.route('/status', methods=['GET'])
def get_status():
    """Get comprehensive AI service status"""
    features = comprehensive_ai_service.get_all_features()
    return jsonify({
        'status': 'operational',
        'service': 'Comprehensive AI Healthcare Platform',
        'version': '2.0',
        'projects_integrated': features['projects_integrated'],
        'total_features': features['total_features'],
        'ai_models': features['ai_models'],
        'timestamp': features['timestamp']
    }), 200
