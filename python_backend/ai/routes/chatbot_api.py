"""
HealthAI Chatbot API Routes
Endpoints for conversational healthcare chatbot
"""

from flask import Blueprint, request, jsonify
from ..features.chatbot.chatbot_service import healthai_chatbot

chatbot_bp = Blueprint('chatbot', __name__, url_prefix='/api/chatbot')

# ========== 1. CHAT MESSAGE ==========
@chatbot_bp.route('/message', methods=['POST'])
def chat_message():
    """Send message to chatbot and get response"""
    try:
        data = request.get_json()
        user_message = data.get('message')
        
        if not user_message:
            return jsonify({'error': 'Message is required'}), 400
        
        result = healthai_chatbot.chat(user_message)
        
        # Add to history
        if result.get('success'):
            response_text = result.get('response', '')
            healthai_chatbot.add_to_history(user_message, response_text)
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ========== 2. GET SYMPTOM SUGGESTIONS ==========
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

# ========== 3. GET HEALTH TIPS ==========
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

# ========== 4. GET CONVERSATION HISTORY ==========
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

# ========== 5. CLEAR HISTORY ==========
@chatbot_bp.route('/history/clear', methods=['POST'])
def clear_history():
    """Clear conversation history"""
    try:
        result = healthai_chatbot.clear_history()
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ========== 6. SERVICE STATUS ==========
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
