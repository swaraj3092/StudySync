import sys
import os

# Add the backend directory to sys.path so imports work correctly on Vercel
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
sys.path.append(backend_path)

from app import app

# Export the app for Vercel
handler = app
