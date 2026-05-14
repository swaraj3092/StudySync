from flask import Blueprint, request, jsonify
from config import db
from bson.objectid import ObjectId
import os, datetime, json

tasks_bp = Blueprint('tasks', __name__)

# ── Gemini setup ───────────────────────────────────────────────────────────────
try:
    import google.generativeai as genai
    genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))
    _model = genai.GenerativeModel('gemini-2.5-flash')
except Exception as e:
    print(f"Gemini init error in tasks.py: {e}")
    _model = None

# ── CRUD ───────────────────────────────────────────────────────────────────────
@tasks_bp.route('/', methods=['GET'])
def get_tasks():
    user_id = request.args.get('userId')
    query = {"userId": user_id} if user_id else {}
    tasks = list(db.tasks.find(query).sort("order", 1))
    for t in tasks:
        t['_id'] = str(t['_id'])
    return jsonify(tasks)

@tasks_bp.route('/', methods=['POST'])
def create_task():
    data = request.json
    data['createdAt'] = datetime.datetime.utcnow().isoformat()
    result = db.tasks.insert_one(data)
    return jsonify({"_id": str(result.inserted_id)}), 201

@tasks_bp.route('/<id>', methods=['GET'])
def get_task(id):
    task = db.tasks.find_one({"_id": ObjectId(id)})
    if task:
        task['_id'] = str(task['_id'])
        return jsonify(task)
    return jsonify({"error": "Task not found"}), 404

@tasks_bp.route('/<id>', methods=['PUT'])
def update_task(id):
    data = request.json
    db.tasks.update_one({"_id": ObjectId(id)}, {"$set": data})
    return jsonify({"status": "updated"})

@tasks_bp.route('/<id>', methods=['DELETE'])
def delete_task(id):
    user_id = request.args.get('userId')
    db.tasks.delete_one({"_id": ObjectId(id), "userId": user_id})
    return jsonify({"status": "deleted"})

# ── AI Smart Schedule (main endpoint) ─────────────────────────────────────────
@tasks_bp.route('/schedule', methods=['POST'])
def schedule_tasks():
    """
    Accepts user's goals and raw tasks.
    Gemini:
      1. Detects dependencies between tasks (which must come before which).
      2. Groups interlinked tasks into clusters.
      3. Sequences them correctly inside each day.
      4. Assigns realistic time slots across a 7-day window.
    Returns a fully ordered, scheduled plan saved to MongoDB.
    """
    body = request.json or {}
    user_id = request.args.get('userId') or body.get('userId')
    goals  = body.get('goals', [])       # ["Crack GATE 2026", "Learn React"]
    tasks  = body.get('tasks', [])       # [{"title":"..","subject":"..","priority":"high"}]
    days   = body.get('days', 7)

    if not user_id:
        return jsonify({"error": "userId required"}), 400
    if not tasks:
        return jsonify({"error": "No tasks provided"}), 400

    today = datetime.datetime.utcnow()
    day_labels = [
        (today + datetime.timedelta(days=i)).strftime('%A, %b %d')
        for i in range(days)
    ]

    tasks_text = '\n'.join(
        f'{i+1}. [{t.get("subject","General")}] {t.get("title","Task")} (priority: {t.get("priority","medium")})'
        for i, t in enumerate(tasks)
    )
    goals_text = '\n'.join(f'- {g}' for g in goals) if goals else '- General study improvement'

    prompt = f"""You are an elite academic architect. A student has provided their high-level GOALS and a list of RAW TASKS.
Your mission is to construct a STRATEGIC, SEQUENCED study plan.

CRITICAL INSTRUCTIONS:
1. IDENTIFY DEPENDENCIES: Look for prerequisite knowledge. If one task is "Learn X" and another is "Practice X", "Learn X" MUST come first.
2. MAINTAIN SEQUENCE: Arrange tasks so the student builds knowledge logically. Prerequisite tasks must be scheduled BEFORE dependent ones.
3. CLUSTER RELATED TOPICS: If tasks are interlinked, group them into a 'cluster' and schedule them in a focused block.
4. GROUND IN GOALS: Use the student's goals to prioritize.
5. BE REALISTIC: Spread tasks across {days} days ({', '.join(day_labels)}). Max 3-4 tasks per day.
6. STRICT ADHERENCE: Do NOT invent new tasks, subjects, or interests. ONLY schedule the exactly provided Raw Tasks.

Student Goals:
{goals_text}

Raw Tasks:
{tasks_text}

Return ONLY a valid JSON array:
[
  {{
    "day": "Day Name",
    "time": "9:00 AM",
    "title": "Task title",
    "subject": "Subject",
    "priority": "high|medium|low",
    "reason": "Strategic reason (mention if it's a prerequisite)",
    "dependsOn": "Prerequisite Title or null",
    "cluster": "Cluster Name or null",
    "order": 1
  }}
]
Schedule all {len(tasks)} tasks across the {days} days, maintaining logical dependency order."""

    if not _model:
        # Fallback: naive sequential schedule
        scheduled = _naive_schedule(tasks, day_labels, user_id)
        _save_schedule(scheduled, user_id)
        return jsonify({"status": "scheduled", "tasks": scheduled, "source": "fallback"})

    try:
        response = _model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        scheduled_raw = json.loads(text)
        scheduled = _save_schedule(scheduled_raw, user_id)
        return jsonify({"status": "scheduled", "tasks": scheduled, "source": "ai"})
    except Exception as e:
        print(f"Schedule error: {e}")
        # Fallback
        scheduled = _naive_schedule(tasks, day_labels, user_id)
        _save_schedule(scheduled, user_id)
        return jsonify({"status": "scheduled", "tasks": scheduled, "source": "fallback", "aiError": str(e)})


def _naive_schedule(tasks: list, day_labels: list, user_id: str) -> list:
    """Simple fallback scheduler when AI is unavailable."""
    time_slots = ["9:00 AM", "11:00 AM", "2:00 PM", "4:00 PM"]
    result = []
    for i, t in enumerate(tasks):
        day = day_labels[i // 4 % len(day_labels)]
        slot = time_slots[i % 4]
        result.append({
            "day": day,
            "time": slot,
            "title": t.get("title", "Task"),
            "subject": t.get("subject", "General"),
            "priority": t.get("priority", "medium"),
            "reason": "Scheduled by StudySync",
            "dependsOn": None,
            "cluster": None,
            "order": i + 1,
        })
    return result


def _save_schedule(scheduled: list, user_id: str) -> list:
    """Delete old AI schedule, save new one, return with _ids."""
    db.tasks.delete_many({"userId": user_id, "aiGenerated": True, "completed": False})
    saved = []
    for i, item in enumerate(scheduled):
        doc = {
            "userId": user_id,
            "title": item.get("title", "Task"),
            "subject": item.get("subject", "General"),
            "time": item.get("time", "10:00 AM"),
            "reason": item.get("reason", "AI scheduled"),
            "priority": item.get("priority", "medium"),
            "day": item.get("day", ""),
            "dependsOn": item.get("dependsOn"),
            "cluster": item.get("cluster"),
            "order": item.get("order", i + 1),
            "completed": False,
            "aiGenerated": True,
            "createdAt": datetime.datetime.utcnow().isoformat(),
        }
        result = db.tasks.insert_one(doc)
        doc["_id"] = str(result.inserted_id)
        saved.append(doc)
    return saved


# ── Legacy generate (kept for backwards compat) ────────────────────────────────
@tasks_bp.route('/generate', methods=['POST'])
def generate_plan():
    """Redirects to schedule with session-based context when no tasks provided."""
    body = request.json or {}
    user_id = request.args.get('userId') or body.get('userId')
    if not user_id:
        return jsonify({"error": "userId required"}), 400

    # Use pending manual tasks
    pending = list(db.tasks.find({"userId": user_id, "completed": False, "aiGenerated": {"$ne": True}}))
    if pending:
        task_list = [{"title": t.get("title"), "subject": t.get("subject", "General"), "priority": t.get("priority", "medium")} for t in pending]
        return schedule_tasks.__wrapped__(user_id, [], task_list, 7) if hasattr(schedule_tasks, '__wrapped__') else \
               jsonify({"error": "Use /tasks/schedule endpoint with tasks array"}), 400

    return jsonify({"error": "No pending tasks. Use /tasks/schedule with goals and tasks."}), 400


# ── Weak Topics Analysis ───────────────────────────────────────────────────────
@tasks_bp.route('/weak-topics', methods=['GET'])
def get_weak_topics():
    user_id = request.args.get('userId')
    if not user_id:
        return jsonify({"error": "userId required"}), 400

    sessions = list(db.sessions.find({"userId": user_id}).sort("startTime", -1).limit(30))
    if not sessions:
        return jsonify({"weakTopics": [], "message": "No sessions yet"})

    notes_corpus = []
    for s in sessions:
        subj = s.get('subject') or s.get('title', 'General')
        ts = s.get('startTime', '')
        notes_corpus.append(f"Session '{subj}' on {ts[:10]}:")
        for n in s.get('notes', [])[:3]:
            text = n.get('text', '') if isinstance(n, dict) else str(n)
            if text:
                notes_corpus.append(f"  - {text[:200]}")

    if not _model:
        return jsonify({"weakTopics": [], "source": "fallback"})

    prompt = f"""You are an AI study coach. Analyse this student's study notes and identify weak areas.

Study History:
{chr(10).join(notes_corpus[:60])}

Identify topics that are:
1. Studied only once and a long time ago (likely forgotten)
2. Show confusion markers ("not sure", "unclear", "?")
3. Have very few notes (surface-level only)

Return ONLY valid JSON (no markdown):
[{{"topic": "...", "lastStudied": "X days ago", "urgency": "high|medium|low", "recommendation": "..."}}]
Return 3-6 weak topics maximum."""

    try:
        response = _model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        weak_topics = json.loads(text)
        return jsonify({"weakTopics": weak_topics, "source": "ai"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
