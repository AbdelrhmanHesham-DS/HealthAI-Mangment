"""
AI Features Routes - All integrated AI capabilities
"""
from flask import Blueprint, request, jsonify
from services.ai_integration_service import ai_integration_service

ai_bp = Blueprint('ai_features', __name__, url_prefix='/api/ai')

# ========== SYMPTOM ANALYSIS ==========
@ai_bp.route('/symptoms/analyze', methods=['POST'])
def analyze_symptoms():
    """Analyze symptoms and suggest possible conditions"""
    try:
        data = request.get_json()
        symptoms = data.get('symptoms', [])
        age = data.get('age')
        gender = data.get('gender')
        
        if not symptoms:
            return jsonify({'error': 'Symptoms list is required'}), 400
        
        result = ai_integration_service.analyze_symptoms(symptoms, age, gender)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ========== BLOOD TEST ANALYSIS ==========
@ai_bp.route('/blood-test/analyze', methods=['POST'])
def analyze_blood_test():
    """Analyze blood test results"""
    try:
        data = request.get_json()
        test_results = data.get('test_results', {})
        
        if not test_results:
            return jsonify({'error': 'Test results are required'}), 400
        
        result = ai_integration_service.analyze_blood_test(test_results)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ========== FIRST AID ==========
@ai_bp.route('/first-aid/guidance', methods=['POST'])
def first_aid_guidance():
    """Get first aid guidance for emergencies"""
    try:
        data = request.get_json()
        emergency = data.get('emergency')
        
        if not emergency:
            return jsonify({'error': 'Emergency description is required'}), 400
        
        result = ai_integration_service.get_first_aid_guidance(emergency)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ========== DOCTOR ASSISTANT ==========
@ai_bp.route('/doctor/assist', methods=['POST'])
def doctor_assist():
    """AI Assistant for doctors"""
    try:
        data = request.get_json()
        task = data.get('task')
        patient_data = data.get('patient_data')
        
        if not task:
            return jsonify({'error': 'Task description is required'}), 400
        
        result = ai_integration_service.doctor_assistant(task, patient_data)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ========== PRESCRIPTION ANALYSIS ==========
@ai_bp.route('/prescription/analyze', methods=['POST'])
def analyze_prescription():
    """Analyze medications for interactions and side effects"""
    try:
        data = request.get_json()
        medications = data.get('medications', [])
        
        if not medications:
            return jsonify({'error': 'Medications list is required'}), 400
        
        result = ai_integration_service.analyze_prescription(medications)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ========== HEALTH MONITORING ==========
@ai_bp.route('/health/monitor', methods=['POST'])
def health_monitoring():
    """Analyze health metrics and provide monitoring recommendations"""
    try:
        data = request.get_json()
        health_metrics = data.get('health_metrics', {})
        
        if not health_metrics:
            return jsonify({'error': 'Health metrics are required'}), 400
        
        result = ai_integration_service.health_monitoring_analysis(health_metrics)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ========== APPOINTMENT ASSISTANT ==========
@ai_bp.route('/appointment/assist', methods=['POST'])
def appointment_assist():
    """AI assistant for appointment scheduling"""
    try:
        data = request.get_json()
        request_text = data.get('request')
        available_doctors = data.get('available_doctors')
        
        if not request_text:
            return jsonify({'error': 'Appointment request is required'}), 400
        
        result = ai_integration_service.appointment_assistant(request_text, available_doctors)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ========== GET AVAILABLE FEATURES ==========
@ai_bp.route('/features', methods=['GET'])
def get_features():
    """Get list of all available AI features"""
    result = ai_integration_service.get_available_features()
    return jsonify(result), 200
