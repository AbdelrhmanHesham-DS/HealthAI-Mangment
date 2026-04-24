"""
HealthAI Doctor Assistant API Routes
Endpoints for doctor consultation features
"""

from flask import Blueprint, request, jsonify
from ..features.doctor_assistant.doctor_service import doctor_assistant

doctor_bp = Blueprint('doctor', __name__, url_prefix='/api/doctor')

# ========== 1. GET DISEASE INFO ==========
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

# ========== 2. GET PRECAUTIONS ==========
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

# ========== 3. SEARCH DISEASES ==========
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

# ========== 4. GET ALL DISEASES ==========
@doctor_bp.route('/disease/list', methods=['GET'])
def get_all_diseases():
    """Get list of all diseases"""
    try:
        result = doctor_assistant.get_all_diseases()
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ========== 5. GET DISEASE SUMMARY ==========
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

# ========== 6. COMPARE DISEASES ==========
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

# ========== 7. GET STATISTICS ==========
@doctor_bp.route('/stats', methods=['GET'])
def get_stats():
    """Get doctor assistant statistics"""
    try:
        result = doctor_assistant.get_doctor_stats()
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ========== 8. SERVICE STATUS ==========
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
