import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "securepay.db")
conn = sqlite3.connect(db_path)
c = conn.cursor()
c.execute("SELECT id, username, password, role FROM profiles")
for row in c.fetchall():
    print(row)
conn.close()
