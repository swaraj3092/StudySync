from flask import Blueprint, request, jsonify
import os
import google.generativeai as genai
from google.api_core.client_options import ClientOptions
from dotenv import load_dotenv
from config import db
from bson.objectid import ObjectId
import datetime
import json
import sys
import io

# Force UTF-8 for Windows to prevent 'charmap' errors with fancy AI responses
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

load_dotenv()

chat_bp = Blueprint('chat', __name__)

# --- GOOGLE CLOUD AGENT BUILDER CONFIG ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = os.path.join(BASE_DIR, "google_credentials.json")

PROJECT_ID = "951358013739"
LOCATION = "global"
ENGINE_ID = "studysync-ultra_1778762807542"

# --- FALLBACK GEMINI (For Vision & Specialized Tools) ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Helper tools (Keeping these for UI consistency)
def get_study_history(user_id, limit=5):
    try:
        user_ids = [user_id, 'dev_guest_user']
        sessions = list(db.sessions.find({"userId": {"$in": user_ids}}).sort("startTime", -1).limit(limit))
        for s in sessions:
            s['_id'] = str(s['_id'])
            if 'startTime' in s and hasattr(s['startTime'], 'isoformat'):
                s['startTime'] = s['startTime'].isoformat()
        return sessions
    except Exception as e:
        return f"Error: {str(e)}"

@chat_bp.route('/send', methods=['POST'])
def send_message():
    data = request.json
    user_message = data.get('message', '')
    user_id = data.get('userId', 'dev_guest_user')
    
    # ─── CALL GOOGLE CLOUD AGENT BUILDER (DIRECT API) ───
    try:
        import requests
        from google.auth.transport.requests import Request
        from google.oauth2 import service_account

        # 1. Get Access Token
        creds = service_account.Credentials.from_service_account_file(
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"],
            scopes=['https://www.googleapis.com/auth/cloud-platform']
        )
        creds.refresh(Request())
        access_token = creds.token

        # 2. Build the API URL
        api_url = f"https://discoveryengine.googleapis.com/v1alpha/projects/{PROJECT_ID}/locations/{LOCATION}/collections/default_collection/engines/{ENGINE_ID}/servingConfigs/default_serving_config:answer"

        # 3. Prepare Payload
        payload = {
            "query": {"text": user_message}
        }
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        # 4. Execute API Request
        response = requests.post(api_url, json=payload, headers=headers)
        
        if response.status_code != 200:
            print(f"Discovery Engine Error ({response.status_code}): {response.text}")
            return fallback_to_gemini(user_message, user_id)

        res_data = response.json()
        
        # 5. Extract Answer
        answer_text = res_data.get('answer', {}).get('answerText', "")
        
        # ─── SMART HYBRID LOGIC ───
        # If the PDF search fails to find a grounded answer, ask Gemini for a general response
        if not answer_text or "A summary could not be generated" in answer_text:
            print(f"No grounded answer found for '{user_message}'. Falling back to General AI...")
            return fallback_to_gemini(user_message, user_id)

        return jsonify({
            "status": "success",
            "response": answer_text,
            "model": "StudySync AI",
            "isQuiz": False,
            "handover": None,
            "results": []
        })

    except Exception as e:
        print(f"Backend Exception: {str(e)}")
        return fallback_to_gemini(user_message, user_id)

# ── Tool Definitions for Gemini ────────────────────────────────────────────────
def create_planner_tasks(tasks_json_str: str, user_id: str):
    """
    Saves a list of tasks to the user's study planner database.
    tasks_json_str: A JSON string containing an array of task objects.
    Each task should have: title, subject, day, time, priority, reason.
    """
    try:
        tasks = json.loads(tasks_json_str)
        from routes.tasks import _save_schedule
        _save_schedule(tasks, user_id)
        return {"status": "success", "message": f"Successfully saved {len(tasks)} tasks to the planner."}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def fallback_to_gemini(user_message, user_id):
    try:
        # Define tools for the AI
        tools = [create_planner_tasks]
        model = genai.GenerativeModel(
            'gemini-2.5-flash',
            tools=tools
        )
        
        # Enhanced system prompt for tool usage
        system_prompt = f"""You are StudySync AI, a brilliant academic companion. 
        Your user_id is '{user_id}'.
        
        CAPABILITIES:
        1. Conversation: Be friendly, supportive, and brilliant.
        2. Planner Integration: If the user asks for a schedule, revision plan, or planner, you MUST:
           - First, generate the plan.
           - Second, call the 'create_planner_tasks' tool to SAVE it to their database.
           - Provide the tasks as a JSON string to the tool.
           - Each task in the list should have: title, subject, day (e.g. 'Monday, May 14'), time (e.g. '10:00 AM'), priority ('high'|'medium'|'low'), and a strategic reason.
        
        Always confirm to the user that you have updated their 'Planner' tab."""
        
        chat = model.start_chat(enable_automatic_function_calling=True)
        response = chat.send_message(f"{system_prompt}\n\nUser Query: {user_message}")
        
        # Check if a tool was called
        tool_call_made = False
        for part in response.candidates[0].content.parts:
            if part.function_call:
                tool_call_made = True
                break

        return jsonify({
            "answer": response.text,
            "tool_used": tool_call_made,
            "tool_name": "create_planner_tasks" if tool_call_made else None,
            "status": "success",
            "model": "StudySync Hybrid (Gemini 2.5 Flash)",
            "handover": None,
            "isQuiz": False,
            "results": []
        })
    except Exception as e:
        return jsonify({"response": "I'm currently busy. Please try again in a moment.", "error": str(e)}), 500

@chat_bp.route('/diagnose', methods=['POST'])
def diagnose_screen():
    data = request.json
    image_data = data.get("image")
    context = data.get("context", "Study session screen")
    session_id = data.get("sessionId")

    if not image_data:
        return jsonify({"error": "No image provided"}), 400

    try:
        import base64, re

        # Strip data URL prefix if present
        if ',' in image_data:
            image_data = image_data.split(',', 1)[1]

        image_bytes = base64.b64decode(image_data)

        model = genai.GenerativeModel('gemini-2.5-flash')

        prompt = """You are StudySync AI Vision. Analyze this screenshot of a study session.

Your task:
1. Extract the KEY educational content visible (bullet points, concepts, formulas, definitions).
2. Write a concise summary (2-4 sentences) of the main topic on screen.
3. Generate 1-2 quick quiz questions based on the visible content.

Return ONLY valid JSON:
{
  "summary": "Brief summary of what is being studied",
  "key_points": ["point 1", "point 2"],
  "quiz": [{"question": "Q?", "answer": "A"}]
}

If no educational content is visible, return: {"summary": null, "key_points": [], "quiz": []}"""

        response = model.generate_content([
            prompt,
            {"mime_type": "image/jpeg", "data": image_bytes}
        ])

        raw = response.text.strip()
        json_match = re.search(r'\{.*\}', raw, re.DOTALL)
        if not json_match:
            return jsonify({"summary": None, "quiz": []}), 200

        result = json.loads(json_match.group())
        summary = result.get("summary")
        quiz = result.get("quiz", [])
        key_points = result.get("key_points", [])

        # Save to MongoDB session
        if session_id and summary:
            try:
                note_doc = {
                    "text": summary,
                    "keyPoints": key_points,
                    "type": "ai_vision",
                    "timestamp": datetime.datetime.utcnow()
                }
                db.sessions.update_one(
                    {"_id": ObjectId(session_id)},
                    {"$push": {"notes": note_doc}}
                )
            except Exception as db_err:
                print(f"DB note save error: {db_err}")

        return jsonify({
            "status": "success",
            "summary": summary,
            "key_points": key_points,
            "quiz": quiz
        })

    except Exception as e:
        print(f"Diagnose error: {str(e)}")
        return jsonify({"error": str(e), "summary": None, "quiz": []}), 500
