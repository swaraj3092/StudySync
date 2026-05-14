from flask import Blueprint, request, jsonify
from config import db
from bson.objectid import ObjectId
import datetime

flashcards_bp = Blueprint('flashcards', __name__)

@flashcards_bp.route('/', methods=['GET'])
def get_flashcards():
    user_id = request.args.get('userId')
    query = {"userId": user_id} if user_id else {}
    flashcards = list(db.flashcards.find(query).sort("createdAt", -1))
    for f in flashcards:
        f['_id'] = str(f['_id'])
    return jsonify(flashcards)

@flashcards_bp.route('/', methods=['POST'])
def create_flashcard():
    data = request.json
    data['createdAt'] = datetime.datetime.utcnow()
    data['nextReview'] = datetime.datetime.utcnow() + datetime.timedelta(days=1)
    data['level'] = 1 # Spaced repetition level
    
    result = db.flashcards.insert_one(data)
    return jsonify({"_id": str(result.inserted_id)}), 201

@flashcards_bp.route('/<id>/review', methods=['POST'])
def review_flashcard(id):
    data = request.json
    quality = data.get('quality', 3) # 1-5 quality of recall
    
    flashcard = db.flashcards.find_one({"_id": ObjectId(id)})
    if not flashcard:
        return jsonify({"error": "Flashcard not found"}), 404
        
    # Simple Spaced Repetition Logic (SM-2 Lite)
    level = flashcard.get('level', 1)
    if quality >= 3:
        level += 1
        days = level * 2
    else:
        level = 1
        days = 1
        
    next_review = datetime.datetime.utcnow() + datetime.timedelta(days=days)
    db.flashcards.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"level": level, "nextReview": next_review}}
    )
    
    return jsonify({"status": "reviewed", "nextReview": next_review})
