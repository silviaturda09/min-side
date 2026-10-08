// Min side – serveren.
//
// Det meste her er ferdig. Det som mangler er de to adressene sida di
// skal snakke med. Dem skriver du selv:
//
//   Oppgave 6:   GET  /api/<tabellen din>   gir alle radene

//   Oppgave 13:  POST /api/<tabellen din>   legger til én rad
//
// Kjør:  npm run dev   (starter på nytt hver gang du lagrer)

import express from 'express';
import { existsSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

if (!existsSync('data.db')) {
  console.log('Fant ikke data.db. Kjør «npm run reset-db» først – den bygger databasen fra database.sql.');
  console.log('Står du i riktig mappe? Sjekk med «pwd».');
  process.exit(1);
}

const db = new DatabaseSync('data.db');

const app = express();
app.use(express.json()); // gjør JSON-en i en POST om til req.body
app.use(express.static('public')); // serverer index.html, app.js og resten av public/

// ---------------------------------------------------------------
// Oppgave 6: GET /api/<tabellen din> – alle radene
// ---------------------------------------------------------------
app.get('/api/film', (req, res) => {
  const filmer = db.prepare('SELECT * FROM film').all();
  res.json(filmer);
});
// ---------------------------------------------------------------
// Oppgave 13: POST /api/<tabellen din> – legg til én rad
// ---------------------------------------------------------------
app.post('/api/film', (req, res) => {
  const { title, year, genre, dice_score, review } = req.body;

  const result = db.prepare(`
    INSERT INTO film (title, year, genre, dice_score, review)
    VALUES (?, ?, ?, ?, ?)
  `).run(title, year, genre, dice_score, review);

  const film = db.prepare('SELECT * FROM film WHERE id = ?').get(result.lastInsertRowid);

  res.status(201).json(film);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Min side kjører på http://localhost:${PORT}`);
});
