"""
HealthAI API Routes - All healthcare AI features
Complete API endpoints for HealthAI analysis features
"""
from flask import Blueprint, request, jsonify
from ..services.healthai_analyzer import healthai_analyzer

healthai_bp = Blueprint('healthai', __name__, url_prefix='/api/healthai')

# ========== 1. SYMPTOM ANALYSIS ==========
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

# ========== 2. DIAGNOSIS PREDICTION ==========
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

# ========== 3. LAB RESULTS ANALYSIS ==========
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

# ========== 4. EMERGENCY GUIDANCE ==========
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

# ========== 5. MEDICATION REVIEW ==========
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

# ========== 6. HEALTH METRICS ANALYSIS ==========
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

# ========== 7. DOCTOR RECOMMENDATION ==========
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

# ========== 8. HEALTH TIPS ==========
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

# ========== 9. EMERGENCY DETECTION ==========
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

# ========== 10. GET ALL FEATURES ==========
@healthai_bp.route('/features', methods=['GET'])
def get_all_features():
    """Get list of all available HealthAI features"""
    result = healthai_analyzer.get_all_features()
    return jsonify(result), 200

# ========== 11. SERVICE STATUS ==========
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
