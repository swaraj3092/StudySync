import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# Use environment variable for MongoDB connection
MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    # Fail gracefully if no URI is provided in production
    print("WARNING: MONGO_URI not found in environment variables.")

client = MongoClient(MONGO_URI)
db = client.get_database("studysync")
