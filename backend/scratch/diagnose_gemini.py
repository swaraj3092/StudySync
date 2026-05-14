import os
import google.generativeai as genai
from dotenv import load_dotenv
import sys

# Load env
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

def diagnose_gemini():
    print(f"--- GEMINI DIAGNOSTIC ---")
    print(f"API Key found: {'Yes' if api_key else 'No'}")
    
    if not api_key:
        return

    genai.configure(api_key=api_key)
    
    print("\n1. Checking Available Models...")
    try:
        available_models = []
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                available_models.append(m.name)
        
        print(f"Found {len(available_models)} models.")
        for model_name in available_models:
            print(f" - {model_name}")
            
    except Exception as e:
        print(f"Error listing models: {repr(e)}")

    print("\n2. Testing Response (Gemini 1.5 Flash - Stable)...")
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content("Hello! Are you working?")
        print(f"Response success: {repr(response.text[:50])}...")
    except Exception as e:
        print(f"Gemini 1.5 failed: {repr(e)}")

    print("\n3. Testing Response (Gemini 2.0 Flash - New)...")
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        response = model.generate_content("Hello! Are you working?")
        print(f"Response success: {repr(response.text[:50])}...")
    except Exception as e:
        print(f"Gemini 2.0 failed: {repr(e)}")

if __name__ == "__main__":
    diagnose_gemini()
