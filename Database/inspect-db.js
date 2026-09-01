const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'authros.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
});

db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'", (err, tables) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log('Found tables:', tables.map(t => t.name));
  let done = 0;
  tables.forEach(t => {
    db.get(`SELECT count(*) as cnt FROM ${t.name}`, (e, row) => {
      console.log(`- ${t.name}: ${row ? row.cnt : 0} rows`);
      done++;
      if (done === tables.length) {
        db.close();
      }
    });
  });
});
