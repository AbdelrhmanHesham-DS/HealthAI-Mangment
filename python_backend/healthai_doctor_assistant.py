"""
Import wrapper for healthai-doctor-assistant.py
Allows importing with underscore naming convention
"""

import importlib.util
import os

# Get the path to healthai-doctor-assistant.py
current_dir = os.path.dirname(__file__)
assistant_file = os.path.join(current_dir, 'healthai-doctor-assistant.py')

# Load the module
spec = importlib.util.spec_from_file_location("healthai_doctor_assistant_module", assistant_file)
assistant_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(assistant_module)

# Export the class and instance
DoctorAssistant = assistant_module.DoctorAssistant
doctor_assistant = assistant_module.doctor_assistant

__all__ = ['DoctorAssistant', 'doctor_assistant']
