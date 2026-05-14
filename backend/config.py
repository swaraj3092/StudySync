import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# Use the direct host string if +srv fails in this environment
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://swarajbehera923_db_user:V3nFD0EWAdtyF8RI@cluster0.f200ejk.mongodb.net/studysync?retryWrites=true&w=majority")

# Fallback for environment with SRV DNS issues
# MONGO_URI = "mongodb://swarajbehera923_db_user:V3nFD0EWAdtyF8RI@ac-vktbr6h-shard-00-00.f200ejk.mongodb.net:27017,ac-vktbr6h-shard-00-01.f200ejk.mongodb.net:27017,ac-vktbr6h-shard-00-02.f200ejk.mongodb.net:27017/studysync?ssl=true&authSource=admin&retryWrites=true&w=majority"

client = MongoClient(MONGO_URI)
db = client.get_database("studysync")
