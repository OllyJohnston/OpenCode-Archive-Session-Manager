import sqlite3
import os
import json
from datetime import datetime

db_path = os.path.expanduser('~/.local/share/opencode/opencode.db')

def get_session_detail(partial_id):
    if not os.path.exists(db_path):
        print(f"Error: Database not found at {db_path}")
        return

    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        
        # Search for the session by full ID or partial ID (ending with)
        query = """
        SELECT id, title, directory, time_created, time_updated, time_archived, 
               summary_additions, summary_deletions, summary_files, summary_diffs
        FROM session 
        WHERE id = ? OR id LIKE ?
        """
        # We try exact match first, then suffix match
        cur.execute(query, (partial_id, f"%{partial_id}"))
        row = cur.fetchone()

        if not row:
            print(f"No session found matching ID: {partial_id}")
        else:
            sid, title, directory, created, updated, archived, adds, dels, files, diffs = row
            print(f"Session Detail for: {sid}")
            print("-" * 50)
            print(f"Title:      {title}")
            print(f"Directory:  {directory}")
            print(f"Created:    {datetime.fromtimestamp(created/1000.0).strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"Updated:    {datetime.fromtimestamp(updated/1000.0).strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"Archived:   {datetime.fromtimestamp(archived/1000.0).strftime('%Y-%m-%d %H:%M:%S') if archived else 'Active'}")
            print(f"Stats:      +{adds} additions, -{dels} deletions, {files} files modified")
            
            if diffs:
                try:
                    diff_list = json.loads(diffs)
                    print("\nRecent Diffs:")
                    for d in diff_list[:5]:
                        name = d.get('newFilename') or d.get('newPath') or 'unknown'
                        print(f"  - {name} (+{d.get('additions', 0)} -{d.get('deletions', 0)})")
                except:
                    print(f"\nRaw Diffs: {diffs[:200]}...")

            # Now let's try to find messages for this session
            print("\nMessages:")
            cur.execute("SELECT data FROM message WHERE session_id = ? ORDER BY time_created ASC", (sid,))
            msg_rows = cur.fetchall()
            print(f"Total messages: {len(msg_rows)}")
            for i, (data_json,) in enumerate(msg_rows[:10]): # Show first 10
                try:
                    data = json.loads(data_json)
                    role = data.get('role', 'unknown')
                    content = data.get('content', '')
                    content_trunc = (content[:80] + '...') if len(content) > 80 else content
                    print(f"  {i+1}. [{role.upper()}] {content_trunc}")
                except:
                    print(f"  {i+1}. [Parse Error]")

        conn.close()
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    import sys
    target_id = sys.argv[1] if len(sys.argv) > 1 else "BHkOkd6K"
    get_session_detail(target_id)
