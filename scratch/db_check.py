import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv("backend/.env")

uri = os.getenv("MONGO_URI")
client = MongoClient(uri)

try:
    db = client.get_database("studysync")
    print(f"Connected to: {db.name}")
    
    collections = db.list_collection_names()
    print(f"Collections: {collections}")
    
    for coll_name in collections:
        count = db[coll_name].count_documents({})
        print(f" - {coll_name}: {count} documents")
        
        if coll_name == 'sessions':
            print("Recent Sessions:")
            recent = db[coll_name].find().sort("startTime", -1).limit(3)
            for s in recent:
                print(f"   * {s.get('title')} ({s.get('startTime')}) - Notes: {len(s.get('notes', []))}")

except Exception as e:
    print(f"Error: {e}")
finally:
    client.close()
