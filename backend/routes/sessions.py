import datetime
from flask import Blueprint, request, jsonify
from config import db
from bson.objectid import ObjectId

sessions_bp = Blueprint('sessions', __name__)

@sessions_bp.route('/', methods=['GET'])
def get_sessions():
    user_id = request.args.get('userId')
    query = {"userId": user_id} if user_id else {}
    limit = int(request.args.get('limit', 10))
    skip = int(request.args.get('skip', 0))
    
    # Optimization: Use $slice to only get the last 2 notes for the preview card
    sessions = list(db.sessions.find(query, {
        "notes": {"$slice": -2}
    }).sort("startTime", -1).skip(skip).limit(limit))
    
    for s in sessions:
        s['_id'] = str(s['_id'])
    return jsonify(sessions)

@sessions_bp.route('/', methods=['POST'])
def create_session():
    data = request.json
    # Ensure userId is present
    if not data.get('userId'):
        return jsonify({"error": "userId is required"}), 400
    
    # Add startTime timestamp if not provided
    if not data.get('startTime'):
        data['startTime'] = datetime.datetime.utcnow().isoformat()
        
    result = db.sessions.insert_one(data)
    return jsonify({"_id": str(result.inserted_id)}), 201

@sessions_bp.route('/<id>', methods=['GET'])
def get_session(id):
    session = db.sessions.find_one({"_id": ObjectId(id)})
    if session:
        session['_id'] = str(session['_id'])
        return jsonify(session)
    return jsonify({"error": "Session not found"}), 404

@sessions_bp.route('/<id>', methods=['PUT'])
def update_session(id):
    data = request.json
    db.sessions.update_one({"_id": ObjectId(id)}, {"$set": data})
    return jsonify({"status": "updated"})

@sessions_bp.route('/<id>', methods=['DELETE'])
def delete_session(id):
    db.sessions.delete_one({"_id": ObjectId(id)})
    return jsonify({"status": "deleted"})

@sessions_bp.route('/<id>/notes', methods=['POST'])
def add_note(id):
    data = request.json
    import datetime
    note_obj = {
        "text": data.get('text'),
        "image": data.get('image'),
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
    db.sessions.update_one(
        {"_id": ObjectId(id)},
        {"$push": {"notes": note_obj}}
    )
    return jsonify({"status": "note added", "note": note_obj}), 201

@sessions_bp.route('/summary', methods=['GET'])
def get_summary():
    user_id = request.args.get('userId')
    if not user_id:
        return jsonify({"todaySessions": 0, "studyTime": "0h 0m", "pendingTasks": 0, "streak": "0 days"})
        
    query = {"userId": user_id}
    
    # Get counts efficiently
    total_sessions = db.sessions.count_documents(query)
    total_tasks = db.tasks.count_documents({"userId": user_id, "completed": False})
    
    # Get durations - we'll still do a quick loop but only on necessary fields
    # In a production app, we would store total_minutes as a field in the User document
    total_minutes = 0
    cursor = db.sessions.find(query, {"duration": 1})
    for s in cursor:
        duration_str = s.get('duration', '0m').lower()
        if 'less than' in duration_str:
            total_minutes += 1
            continue
            
        # Parse '1h 20m' or '45m'
        try:
            h = 0
            m = 0
            parts = duration_str.split()
            for p in parts:
                if 'h' in p: h = int(p.replace('h', ''))
                if 'm' in p: m = int(p.replace('m', ''))
            total_minutes += (h * 60) + m
        except:
            pass
            
    study_time = f"{total_minutes // 60}h {total_minutes % 60}m"
    
    # Calculate REAL daily streak
    # Get all startTimes, parse to dates, find unique dates, sort descending
    dates = []
    for s in db.sessions.find(query, {"startTime": 1}):
        if s.get('startTime'):
            try:
                # Assuming ISO format like 2024-05-13T10:00:00
                dt = datetime.datetime.fromisoformat(s['startTime'].replace('Z', ''))
                dates.append(dt.date())
            except:
                pass
    
    unique_dates = sorted(list(set(dates)), reverse=True)
    
    streak_val = 0
    if unique_dates:
        today = datetime.date.today()
        yesterday = today - datetime.timedelta(days=1)
        
        # Check if the most recent study was today or yesterday to maintain streak
        if unique_dates[0] == today or unique_dates[0] == yesterday:
            streak_val = 1
            for i in range(len(unique_dates) - 1):
                if (unique_dates[i] - unique_dates[i+1]).days == 1:
                    streak_val += 1
                else:
                    break
        else:
            streak_val = 0

    summary = {
        "todaySessions": db.sessions.count_documents({**query, "startTime": {"$regex": f"^{datetime.date.today().isoformat()}"}}),
        "studyTime": study_time,
        "pendingTasks": total_tasks,
        "streak": f"{streak_val} days"
    }
    return jsonify(summary)


@sessions_bp.route('/<id>/notes/<int:note_index>', methods=['PUT'])
def update_note(id, note_index):
    data = request.json
    session = db.sessions.find_one({"_id": ObjectId(id)})
    if not session:
        return jsonify({"error": "Session not found"}), 404
    
    notes = session.get('notes', [])
    if note_index < 0 or note_index >= len(notes):
        return jsonify({"error": "Note not found"}), 404
    
    # Update note fields
    if isinstance(notes[note_index], dict):
        if 'text' in data: notes[note_index]['text'] = data['text']
        if 'title' in data: notes[note_index]['title'] = data['title'] # In case we add explicit titles
    else:
        # If it was a plain string, convert to dict if updating
        notes[note_index] = {"text": data.get('text', notes[note_index]), "timestamp": datetime.datetime.utcnow().isoformat()}

    db.sessions.update_one({"_id": ObjectId(id)}, {"$set": {"notes": notes}})
    return jsonify({"status": "note updated"})

@sessions_bp.route('/<id>/ai-summary', methods=['GET'])
def get_session_ai_summary(id):
    session = db.sessions.find_one({"_id": ObjectId(id)})
    if not session:
        return jsonify({"error": "Session not found"}), 404

    notes = session.get('notes', [])
    notes_text = '\n'.join([
        (n.get('text', '') if isinstance(n, dict) else str(n)) for n in notes
    ])

    try:
        import os, google.generativeai as genai
        genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))
        model = genai.GenerativeModel('gemini-2.5-flash')
        prompt = (
            f"Summarise this study session in 3-4 sentences for a student.\n"
            f"Title: {session.get('title', 'Study Session')}\n"
            f"Type: {session.get('sourceType', 'article')}\n"
            f"Duration: {session.get('duration', 'unknown')}\n"
            f"Notes captured:\n{notes_text or 'No notes captured.'}\n\n"
            "Write a concise, encouraging summary highlighting key concepts covered and suggest one follow-up action."
        )
        response = model.generate_content(prompt)
        return jsonify({"summary": response.text.strip()})
    except Exception as e:
        fallback = (f"You studied '{session.get('title')}' for {session.get('duration', 'some time')}. "
                    f"{len(notes)} notes were captured. Keep up the great work!")
        return jsonify({"summary": fallback})


@sessions_bp.route('/<id>/export-pdf', methods=['GET'])
def export_session_pdf(id):
    session = db.sessions.find_one({"_id": ObjectId(id)})
    if not session:
        return "Session not found", 404

    notes = session.get('notes', [])
    
    # Simple HTML template for a professional report
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>StudySync Report - {session.get('title')}</title>
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px; }}
            .header {{ border-bottom: 2px solid #7c6eff; padding-bottom: 20px; margin-bottom: 30px; }}
            .logo {{ color: #7c6eff; font-weight: 800; font-size: 24px; margin-bottom: 10px; }}
            h1 {{ margin: 0; font-size: 28px; }}
            .meta {{ color: #666; font-size: 14px; margin-top: 5px; }}
            .summary {{ background: #f9f9ff; border-left: 4px solid #7c6eff; padding: 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0; }}
            .summary h2 {{ margin-top: 0; font-size: 18px; color: #7c6eff; }}
            .note-item {{ margin-bottom: 25px; padding-bottom: 15px; border-bottom: 1px solid #eee; page-break-inside: avoid; }}
            .note-meta {{ font-size: 12px; color: #888; margin-bottom: 8px; font-weight: 600; }}
            .note-snap {{ width: 100%; border-radius: 8px; margin: 10px 0; border: 1px solid #ddd; }}
            .note-text {{ font-size: 16px; }}
            .footer {{ margin-top: 50px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }}
            @media print {{
                body {{ padding: 20px; }}
                .no-print {{ display: none; }}
            }}
        </style>
    </head>
    <body>
        <div class="no-print" style="position: fixed; top: 20px; right: 20px;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #7c6eff; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">Download PDF / Print</button>
        </div>

        <div class="header">
            <div class="logo">✦ StudySync AI</div>
            <h1 style="margin-top: 10px; color: #1a1b23;">Lecture Study Report</h1>
            <div class="meta">
                <strong>Session:</strong> {session.get('title', 'Study Session')} <br/>
                <strong>Source:</strong> {session.get('sourceType', 'YouTube').capitalize()} | 
                <strong>Duration:</strong> {session.get('duration', 'N/A')} | 
                <strong>Date:</strong> {session.get('startTime', '')[:10]}
            </div>
        </div>

        <div class="summary">
            <h2>Session Overview</h2>
            <p>This report contains AI-analyzed snapshots and organized lecture notes captured during your focus session. Use the timestamps to relate points back to the video timeline.</p>
        </div>

        <div class="notes-container">
            <h2 style="color: #7c6eff; font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 10px;">Organized Notes & Captures</h2>
            {"".join([f'''
            <div class="note-item">
                <div class="note-meta">TIMESTAMP: {n.get('timestamp', '')[11:19] if 'timestamp' in n else 'N/A'}</div>
                {f'<img src="{n.get("image")}" class="note-snap" />' if n.get('image') else ''}
                <div class="note-text" style="white-space: pre-line;">{n.get('text', '')}</div>
            </div>
            ''' for n in notes])}
        </div>

        <div class="footer">
            Generated by StudySync AI - Your Intelligent Study Co-pilot <br/>
            &copy; {datetime.datetime.now().year} StudySync
        </div>
    </body>
    </html>
    """
    return html

