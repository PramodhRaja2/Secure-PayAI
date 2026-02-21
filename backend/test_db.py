from database import init_db
import traceback

try:
    print("Initializing Database...")
    init_db()
    print("Database Initialized Successfully!")
except Exception as e:
    print("Database Initialization Failed!")
    traceback.print_exc()
