import os
import google.generativeai as genai
import traceback

# The key should be loaded from environment
key = os.getenv("GEMINI_API_KEY")
if not key:
    print("GEMINI_API_KEY not found")
    exit(1)

genai.configure(api_key=key)

try:
    print(f"Testing key: {key[:10]}...")
    model = genai.GenerativeModel('gemini-flash-latest')
    response = model.generate_content("Hi")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Failed: {e}")
    # print(traceback.format_exc())
