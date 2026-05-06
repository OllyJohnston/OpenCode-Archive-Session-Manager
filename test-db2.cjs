const sqlite = require('node:sqlite');
const db = new sqlite.DatabaseSync('C:/Users/Olly/.local/share/opencode/opencode.db');
const cols = db.prepare("PRAGMA table_info(session)").all();
console.log('Columns:', JSON.stringify(cols.map(c => c.name), null, 2));
const r = db.prepare("SELECT id, title, time_archived FROM session WHERE time_archived IS NOT NULL LIMIT 5").all();
console.log('\nArchived sessions:', JSON.stringify(r, null, 2));
db.close();
