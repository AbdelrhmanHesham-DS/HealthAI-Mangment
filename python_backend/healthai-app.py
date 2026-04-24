"""
HealthAI Backend - Python Flask Application
AI-powered healthcare platform with OpenAI integration
Reorganized with flat structure and kebab-case naming
"""
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from datetime import datetime
import os
from dotenv import load_dotenv
from bson import ObjectId
import io

# Import services
from services.chatbot_service import chatbot_service
from services.analysis_service import analysis_service
from services.report_service import report_service

# Import new reorganized modules
# Note: Import using underscore for Python module naming
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

# Import blueprints from reorganized files
from healthai_api_routes import doctor_bp, chatbot_bp, healthai_bp

load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Register blueprints
app.register_blueprint(doctor_bp)
app.register_blueprint(chatbot_bp)
app.register_blueprint(healthai_bp)

# Configuration
app.config['JSON_SORT_KEYS'] = False
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True

# ============================================================================
# HEALTH CHECK ENDPOINTS
# ============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'message': 'HealthAI Backend is running',
        'timestamp': datetime.now().isoformat()
    }), 200


# ============================================================================
# CHATBOT ENDPOINTS
# ============================================================================

@app.route('/api/chat/message', methods=['POST'])
def send_chat_message():
    """Send a message to the AI chatbot"""
    try:
        data = request.get_json()
        user_message = data.get('message')
        conversation_history = data.get('history', [])
        patient_context = data.get('patientContext')
        
        if not user_message:
            return jsonify({'error': 'Message is required'}), 400
        
        response = chatbot_service.send_message(
            user_message,
            conversation_history,
            patient_context
        )
        
        return jsonify(response), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/chat/symptoms', methods=['POST'])
def analyze_symptoms():
    """Analyze symptoms and suggest medical specialties"""
    try:
        data = request.get_json()
        symptoms = data.get('symptoms', [])
        
        if not symptoms:
            return jsonify({'error': 'Symptoms list is required'}), 400
        
        analysis = chatbot_service.analyze_symptoms(symptoms)
        return jsonify(analysis), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# ANALYSIS ENDPOINTS
# ============================================================================

@app.route('/api/analysis/trend/<metric_type>', methods=['POST'])
def analyze_trend(metric_type):
    """Analyze trend for a specific metric"""
    try:
        data = request.get_json()
        metric_data = data.get('data', [])
        months = data.get('months', 6)
        
        if not metric_data:
            return jsonify({'error': 'Metric data is required'}), 400
        
        trend_analysis = analysis_service.analyze_trend(metric_data, metric_type, months)
        return jsonify(trend_analysis), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/analysis/correlations', methods=['POST'])
def find_correlations():
    """Find correlations between metrics"""
    try:
        data = request.get_json()
        metrics_data = data.get('metrics', {})
        
        if not metrics_data:
            return jsonify({'error': 'Metrics data is required'}), 400
        
        correlations = analysis_service.find_correlations(metrics_data)
        return jsonify(correlations), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/analysis/risk-score', methods=['POST'])
def calculate_risk_score():
    """Calculate health risk score"""
    try:
        data = request.get_json()
        metrics = data.get('metrics', {})
        medical_history = data.get('medicalHistory', [])
        
        if not metrics:
            return jsonify({'error': 'Metrics are required'}), 400
        
        risk_score = analysis_service.calculate_risk_score(metrics, medical_history)
        return jsonify(risk_score), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/analysis/anomalies/<metric_type>', methods=['POST'])
def detect_anomalies(metric_type):
    """Detect anomalies in metric data"""
    try:
        data = request.get_json()
        metric_data = data.get('data', [])
        threshold = data.get('threshold', 2.0)
        
        if not metric_data:
            return jsonify({'error': 'Metric data is required'}), 400
        
        anomalies = analysis_service.detect_anomalies(metric_data, metric_type, threshold)
        return jsonify(anomalies), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# REPORT GENERATION ENDPOINTS
# ============================================================================

@app.route('/api/reports/consultation', methods=['POST'])
def generate_consultation_report():
    """Generate consultation report"""
    try:
        data = request.get_json()
        patient_id = data.get('patientId')
        consultation_data = data.get('consultationData', {})
        options = data.get('options', {})
        
        if not patient_id:
            return jsonify({'error': 'patientId is required'}), 400
        
        # Generate PDF
        pdf_bytes = report_service.generate_consultation_report(
            consultation_data,
            patient_id,
            options
        )
        
        # Return PDF file
        return send_file(
            io.BytesIO(pdf_bytes),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'consultation_report_{patient_id}_{datetime.now().strftime("%Y%m%d")}.pdf'
        )
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/reports/summary', methods=['POST'])
def generate_ai_summary():
    """Generate AI summary of consultation"""
    try:
        data = request.get_json()
        consultation_data = data.get('consultationData', {})
        audience_type = data.get('audienceType', 'patient')
        
        if not consultation_data:
            return jsonify({'error': 'consultationData is required'}), 400
        
        summary = report_service.generate_ai_summary(consultation_data, audience_type)
        
        return jsonify({
            'summary': summary,
            'audienceType': audience_type,
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({'error': 'Internal server error'}), 500


# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('DEBUG', 'False') == 'True'
    
    print(f'🚀 HealthAI Backend starting on port {port}...')
    print(f'📊 AI Services: Doctor Assistant, Chatbot, HealthAI Core')
    print(f'🔗 OpenAI GPT-4 Integration: Ready')
    print(f'💾 MongoDB Connection: {os.getenv("MONGO_URI", "mongodb://localhost:27017")}')
    print(f'📁 Structure: Flat with kebab-case naming')
    
    app.run(host='0.0.0.0', port=port, debug=debug)
