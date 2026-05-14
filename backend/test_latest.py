import os
import google.generativeai as genai
from dotenv import load_dotenv
import traceback

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

try:
    print("Testing gemini-flash-latest...")
    model = genai.GenerativeModel('gemini-flash-latest')
    response = model.generate_content("Hi")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Failed: {e}")
    print(traceback.format_exc())
