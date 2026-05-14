import os
import google.generativeai as genai
import traceback

# The key from the user's .env
key = "AIzaSyCaGNs5rDXgBq0Jw2Cltwm1Y6AUeEH5Wp0"
genai.configure(api_key=key)

try:
    print(f"Testing key: {key[:10]}...")
    model = genai.GenerativeModel('gemini-flash-latest')
    response = model.generate_content("Hi")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Failed: {e}")
    # print(traceback.format_exc())
