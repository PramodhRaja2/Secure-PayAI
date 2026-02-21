import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "securepay.db")
conn = sqlite3.connect(db_path)
c = conn.cursor()

try:
    c.execute("ALTER TABLE transactions ADD COLUMN status VARCHAR DEFAULT 'approved'")
    print("Successfully added 'status' column to transactions table.")
except sqlite3.OperationalError as e:
    if "duplicate column name" in str(e).lower():
        print("Column 'status' already exists.")
    else:
        print(f"Error adding column: {e}")

conn.commit()
conn.close()
