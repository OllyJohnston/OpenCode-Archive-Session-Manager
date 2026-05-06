import sqlite3
import os
from datetime import datetime

db_path = os.path.expanduser('~/.local/share/opencode/opencode.db')

def list_archived():
    if not os.path.exists(db_path):
        print(f"Error: Database not found at {db_path}")
        return

    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        
        # Check if column exists
        cur.execute("PRAGMA table_info(session)")
        columns = [c[1] for c in cur.fetchall()]
        if 'time_archived' not in columns:
            print("Error: 'time_archived' column not found in 'session' table.")
            return

        query = """
        SELECT id, title, directory, time_created, time_archived 
        FROM session 
        WHERE time_archived IS NOT NULL AND time_archived > 0 
        ORDER BY time_archived DESC
        """
        cur.execute(query)
        rows = cur.fetchall()

        if not rows:
            print("No archived sessions found in the database.")
        else:
            print(f"Found {len(rows)} archived session(s):\n")
            print(f"{'ID':<10} | {'Title':<40} | {'Archived':<20}")
            print("-" * 75)
            for r in rows:
                sid, title, directory, created, archived = r
                # Handle millisecond timestamps
                ts = datetime.fromtimestamp(archived / 1000.0).strftime('%Y-%m-%d %H:%M')
                print(f"{str(sid)[-8:]: <10} | {str(title)[:40]: <40} | {ts}")
        
        conn.close()
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    list_archived()
