// Bygger data.db på nytt fra database.sql. Denne fila er ferdig.
//
// Kjør:  npm run reset-db
//
// Vi sletter ikke fila, men tømmer den og fyller den på nytt. Da ser en
// server som allerede kjører de nye dataene med en gang – og Windows
// nekter uansett å slette en fil som serveren har åpen.

import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('data.db');

// Fremmednøkler av mens vi river, ellers må tabellene slettes i
// akkurat riktig rekkefølge.
db.exec('PRAGMA foreign_keys = OFF');

const gammelt = db
  .prepare(
    `SELECT type, name FROM sqlite_schema
     WHERE name NOT LIKE 'sqlite_%' AND type IN ('view', 'trigger', 'table')`,
  )
  .all();

for (const { type, name } of gammelt) {
  db.exec(`DROP ${type.toUpperCase()} IF EXISTS "${name}"`);
}

db.exec('PRAGMA foreign_keys = ON');

try {
  db.exec(readFileSync('database.sql', 'utf8'));
} catch (feil) {
  console.error('\ndatabase.sql har en feil, så data.db er tom nå.');
  console.error(`SQLite sier: ${feil.message}\n`);
  console.error('Rett feilen og kjør «npm run reset-db» igjen.');
  process.exit(1);
}

const tabeller = db
  .prepare(`SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY rowid`)
  .all();

if (tabeller.length === 0) {
  console.log('data.db er bygget, men database.sql lager ingen tabeller ennå.');
} else {
  console.log('data.db er bygget på nytt:');
  for (const { name } of tabeller) {
    const { n } = db.prepare(`SELECT COUNT(*) AS n FROM "${name}"`).get();
    console.log(`  ${name}: ${n} rader`);
  }
}
