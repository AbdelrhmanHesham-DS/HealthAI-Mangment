"""
Import wrapper for healthai-chatbot.py
Allows importing with underscore naming convention
"""

import importlib.util
import os

# Get the path to healthai-chatbot.py
current_dir = os.path.dirname(__file__)
chatbot_file = os.path.join(current_dir, 'healthai-chatbot.py')

# Load the module
spec = importlib.util.spec_from_file_location("healthai_chatbot_module", chatbot_file)
chatbot_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(chatbot_module)

# Export the class and instance
HealthAIChatbot = chatbot_module.HealthAIChatbot
healthai_chatbot = chatbot_module.healthai_chatbot

__all__ = ['HealthAIChatbot', 'healthai_chatbot']
