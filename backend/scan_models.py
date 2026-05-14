import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

print("Scanning for available Gemini models...")

try:
    available_models = genai.list_models()
    for m in available_models:
        if 'generateContent' in m.supported_generation_methods:
            model_id = m.name.replace('models/', '')
            try:
                print(f"Testing {model_id}...", end=" ", flush=True)
                # Skip the ones we know are failing to save time
                if "2.5-flash" in model_id or "3-flash" in model_id:
                    print("EXHAUSTED (Skip)")
                    continue
                
                model = genai.GenerativeModel(model_id)
                response = model.generate_content("Hi", request_options={"timeout": 10})
                print("WORKING")
            except Exception as e:
                print("FAILED")
except Exception as e:
    print(f"Error listing models: {e}")
