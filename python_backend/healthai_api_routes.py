"""
Import wrapper for healthai-api-routes.py
Allows importing with underscore naming convention
"""

# Import from the kebab-case file
import importlib.util
import os

# Get the path to healthai-api-routes.py
current_dir = os.path.dirname(__file__)
routes_file = os.path.join(current_dir, 'healthai-api-routes.py')

# Load the module
spec = importlib.util.spec_from_file_location("healthai_api_routes_module", routes_file)
routes_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(routes_module)

# Export the blueprints
doctor_bp = routes_module.doctor_bp
chatbot_bp = routes_module.chatbot_bp
healthai_bp = routes_module.healthai_bp

__all__ = ['doctor_bp', 'chatbot_bp', 'healthai_bp']
