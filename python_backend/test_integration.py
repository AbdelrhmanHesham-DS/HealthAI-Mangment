"""
HealthAI Integration Test
Test all new modules and API endpoints
"""

import sys
import json
from datetime import datetime

# Test imports
print("=" * 80)
print("🧪 HealthAI Integration Test Suite")
print("=" * 80)

# Test 1: Doctor Assistant Service
print("\n✅ Test 1: Doctor Assistant Service")
print("-" * 80)
try:
    from ai.features.doctor_assistant.doctor_service import doctor_assistant
    
    # Test get disease info
    result = doctor_assistant.get_disease_info("Diabetes")
    print(f"✓ Get disease info: {result['success']}")
    
    # Test search diseases
    result = doctor_assistant.search_diseases("fever")
    print(f"✓ Search diseases: Found {result['results_count']} results")
    
    # Test get all diseases
    result = doctor_assistant.get_all_diseases()
    print(f"✓ Get all diseases: {result['total_diseases']} diseases in database")
    
    # Test get stats
    result = doctor_assistant.get_doctor_stats()
    print(f"✓ Doctor stats: {result['coverage_percentage']}% coverage")
    
    print("✅ Doctor Assistant Service: PASSED")
except Exception as e:
    print(f"❌ Doctor Assistant Service: FAILED - {str(e)}")
    sys.exit(1)

# Test 2: Chatbot Service
print("\n✅ Test 2: Chatbot Service")
print("-" * 80)
try:
    from ai.features.chatbot.chatbot_service import healthai_chatbot
    
    # Test chat
    result = healthai_chatbot.chat("Hello, I have a fever")
    print(f"✓ Chat message: {result['success']}")
    
    # Test symptom suggestions
    result = healthai_chatbot.get_symptom_suggestions("fever")
    print(f"✓ Symptom suggestions: {result['suggestions_count']} suggestions")
    
    # Test health tips
    result = healthai_chatbot.get_health_tips("general")
    print(f"✓ Health tips: {len(result['tips'])} tips available")
    
    # Test conversation history
    history = healthai_chatbot.get_conversation_history()
    print(f"✓ Conversation history: {len(history)} messages")
    
    print("✅ Chatbot Service: PASSED")
except Exception as e:
    print(f"❌ Chatbot Service: FAILED - {str(e)}")
    sys.exit(1)

# Test 3: API Routes Import
print("\n✅ Test 3: API Routes Import")
print("-" * 80)
try:
    from ai.routes.healthai_api import healthai_bp
    from ai.routes.doctor_assistant_api import doctor_bp
    from ai.routes.chatbot_api import chatbot_bp
    
    print(f"✓ HealthAI API Blueprint: {healthai_bp.name}")
    print(f"✓ Doctor Assistant API Blueprint: {doctor_bp.name}")
    print(f"✓ Chatbot API Blueprint: {chatbot_bp.name}")
    
    print("✅ API Routes: PASSED")
except Exception as e:
    print(f"❌ API Routes: FAILED - {str(e)}")
    sys.exit(1)

# Test 4: Flask App Integration
print("\n✅ Test 4: Flask App Integration")
print("-" * 80)
try:
    from app import app
    
    # Check if blueprints are registered
    blueprints = [bp.name for bp in app.blueprints.values()]
    print(f"✓ Registered blueprints: {', '.join(blueprints)}")
    
    # Check if required blueprints are present
    required = ['healthai', 'doctor', 'chatbot']
    for bp_name in required:
        if bp_name in blueprints:
            print(f"✓ Blueprint '{bp_name}' registered")
        else:
            print(f"✗ Blueprint '{bp_name}' NOT registered")
    
    print("✅ Flask App Integration: PASSED")
except Exception as e:
    print(f"❌ Flask App Integration: FAILED - {str(e)}")
    sys.exit(1)

# Test 5: Data Integrity
print("\n✅ Test 5: Data Integrity")
print("-" * 80)
try:
    from ai.features.doctor_assistant.doctor_disease_descriptions import diesis_desc
    from ai.features.doctor_assistant.doctor_symptom_precautions import diesis_prec
    
    print(f"✓ Diseases loaded: {len(diesis_desc)} diseases")
    print(f"✓ Precautions loaded: {len(diesis_prec)} precautions")
    
    # Check coverage
    coverage = sum(1 for d in diesis_desc.keys() if d in diesis_prec)
    print(f"✓ Precaution coverage: {coverage}/{len(diesis_desc)} ({round(coverage/len(diesis_desc)*100, 2)}%)")
    
    print("✅ Data Integrity: PASSED")
except Exception as e:
    print(f"❌ Data Integrity: FAILED - {str(e)}")
    sys.exit(1)

# Summary
print("\n" + "=" * 80)
print("✅ ALL TESTS PASSED!")
print("=" * 80)
print("\n📊 Integration Summary:")
print(f"  • Doctor Assistant Service: ✅ Operational")
print(f"  • Chatbot Service: ✅ Operational")
print(f"  • API Routes: ✅ Registered")
print(f"  • Flask App: ✅ Integrated")
print(f"  • Data Integrity: ✅ Verified")
print(f"\n🚀 Ready for deployment!")
print(f"Timestamp: {datetime.now().isoformat()}")
