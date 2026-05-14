from config import db

def init_db():
    print("Initializing StudySync Database Indexes...")
    
    # Sessions indexes
    print("- Creating sessions.userId index...")
    db.sessions.create_index("userId")
    print("- Creating sessions.startTime index...")
    db.sessions.create_index("startTime")
    
    # Tasks indexes
    print("- Creating tasks.userId index...")
    db.tasks.create_index("userId")
    print("- Creating tasks.completed index...")
    db.tasks.create_index("completed")
    print("- Creating tasks.order index...")
    db.tasks.create_index("order")
    
    # Notes / Flashcards
    print("- Creating flashcards.userId index...")
    db.flashcards.create_index("userId")
    
    print("Database optimization complete!")

if __name__ == "__main__":
    init_db()
