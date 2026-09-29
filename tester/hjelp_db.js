// Hjelpefil for testene. Denne fila skal du ikke endre –
// men du har lov (og godt av) å lese den.
//
// Testene vet ikke hva sida di handler om. Derfor leser de database.sql
// og finner ut av det selv: hva tabellen heter, og hvilke kolonner den
// har. Alt annet sjekkes ut fra det.
//
// Vi bygger en fersk database i minnet hver gang, rett fra database.sql.
// Da rører testene aldri data.db, og det du har lagt inn via skjemaet
// blir liggende i fred.

import { existsSync, readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const FIL = new URL('../database.sql', import.meta.url);

// Gir { db } hvis database.sql kjører, ellers { feil: 'forklaring' }.
export function byggDb() {
  if (!existsSync(FIL)) {
    return { feil: 'Fant ikke database.sql. Den skal ligge øverst i prosjektmappa.' };
  }

  const db = new DatabaseSync(':memory:');

  try {
    db.exec(readFileSync(FIL, 'utf8'));
  } catch (feil) {
    return { feil: `database.sql har en feil. SQLite sier: ${feil.message}` };
  }

  return { db };
}

export function tabeller(db) {
  return db
    .prepare(`SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY rowid`)
    .all()
    .map((rad) => rad.name);
}

// [{ navn: 'tittel', type: 'TEXT', pk: false }, ...]
export function kolonner(db, tabell) {
  return db
    .prepare(`PRAGMA table_info("${tabell}")`)
    .all()
    .map((k) => ({ navn: k.name, type: k.type.toUpperCase(), pk: k.pk > 0 }));
}

export function antallRader(db, tabell) {
  return db.prepare(`SELECT COUNT(*) AS n FROM "${tabell}"`).get().n;
}

// Hovedtabellen er den med flest kolonner. Er det likt, vinner den første.
// Gir { navn, kolonner, felt, id, rader } – eller { feil } med en forklaring.
//   felt = kolonnene utenom primærnøkkelen, altså de skjemaet kan fylle ut
//   id   = navnet på primærnøkkelen, eller null
//   fk   = kolonnene som er fremmednøkler (⭐), for eksempel plattform_id
export function hovedtabell() {
  const { db, feil } = byggDb();
  if (feil) return { feil };

  const alle = tabeller(db);

  if (alle.length === 0) {
    return { feil: 'database.sql lager ingen tabeller ennå. Start med CREATE TABLE (oppgave 5).' };
  }

  let navn = alle[0];
  for (const t of alle) {
    if (kolonner(db, t).length > kolonner(db, navn).length) navn = t;
  }

  const k = kolonner(db, navn);

  return {
    navn,
    kolonner: k,
    felt: k.filter((kol) => !kol.pk).map((kol) => kol.navn),
    id: k.find((kol) => kol.pk)?.navn ?? null,
    fk: db.prepare(`PRAGMA foreign_key_list("${navn}")`).all().map((f) => f.from),
    rader: antallRader(db, navn),
    db,
  };
}
