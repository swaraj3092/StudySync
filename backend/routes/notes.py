from flask import Blueprint, request, jsonify
from config import db
from bson.objectid import ObjectId

notes_bp = Blueprint('notes', __name__)

@notes_bp.route('/', methods=['GET'])
def get_notes():
    user_id = request.args.get('userId')
    query = {"userId": user_id} if user_id else {}
    notes = list(db.notes.find(query))
    for n in notes:
        n['_id'] = str(n['_id'])
    return jsonify(notes)

@notes_bp.route('/', methods=['POST'])
def create_note():
    data = request.json
    # userId should be provided by frontend
    result = db.notes.insert_one(data)
    return jsonify({"_id": str(result.inserted_id)}), 201

@notes_bp.route('/<id>', methods=['GET'])
def get_note(id):
    user_id = request.args.get('userId')
    note = db.notes.find_one({"_id": ObjectId(id), "userId": user_id})
    if note:
        note['_id'] = str(note['_id'])
        return jsonify(note)
    return jsonify({"error": "Note not found"}), 404

@notes_bp.route('/<id>', methods=['PUT'])
def update_note(id):
    user_id = request.args.get('userId')
    data = request.json
    db.notes.update_one({"_id": ObjectId(id), "userId": user_id}, {"$set": data})
    return jsonify({"status": "updated"})

@notes_bp.route('/<id>', methods=['DELETE'])
def delete_note(id):
    user_id = request.args.get('userId')
    db.notes.delete_one({"_id": ObjectId(id), "userId": user_id})
    return jsonify({"status": "deleted"})
