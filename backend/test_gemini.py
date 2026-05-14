import os
import google.generativeai as genai
from dotenv import load_dotenv
import traceback

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def test_gemini():
    try:
        print(f"Testing with API Key: {GEMINI_API_KEY[:5]}...{GEMINI_API_KEY[-5:] if GEMINI_API_KEY else 'NONE'}")
        if not GEMINI_API_KEY:
            print("ERROR: GEMINI_API_KEY is missing!")
            return

        genai.configure(api_key=GEMINI_API_KEY)
        
        # Test 1.5 Flash
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content("Hi")
        print(f"1.5 Flash Response: {response.text}")
        
        # Test 2.0 Flash Exp
        model_2 = genai.GenerativeModel('gemini-2.0-flash-exp')
        response_2 = model_2.generate_content("Hi")
        print(f"2.0 Flash Exp Response: {response_2.text}")
        
        print("SUCCESS: Both models are reachable.")
    except Exception as e:
        print("FAILURE: Gemini test failed.")
        print(traceback.format_exc())

if __name__ == "__main__":
    test_gemini()
