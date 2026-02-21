import sqlite3
try:
    conn = sqlite3.connect('test_raw.db')
    c = conn.cursor()
    c.execute('CREATE TABLE test (name TEXT)')
    c.execute('INSERT INTO test VALUES (?)', ('admin',))
    conn.commit()
    print("Raw SQLite Success!")
    conn.close()
except Exception as e:
    print(f"Raw SQLite Failed: {e}")
