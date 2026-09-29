// Ferdige tester for databasen din (oppgave 5).
// Du skal ikke endre denne fila. Les den – den er oppskriften.
//
// Kjør:  npm run database
//
// Testene leser database.sql, ikke data.db. Du trenger altså ikke kjøre
// reset-db for at de skal se endringene dine – men serveren trenger det.

import { test } from 'node:test';
import assert from 'node:assert';
import { byggDb, tabeller, kolonner, hovedtabell } from './hjelp_db.js';

test('Oppgave 5: database.sql kjører uten feil', () => {
  const { feil } = byggDb();
  assert.ok(!feil, feil);
});

test('Oppgave 5: det finnes en tabell', () => {
  const t = hovedtabell();
  assert.ok(!t.feil, t.feil);
});

test('Oppgave 5: tabellnavnet kan brukes i en adresse', () => {
  const t = hovedtabell();
  assert.ok(!t.feil, t.feil);

  assert.match(
    t.navn,
    /^[A-Za-z][A-Za-z0-9_]*$/,
    `Tabellen heter «${t.navn}». Det går fint i SQLite – men navnet blir også adressen /api/${t.navn}.\n` +
      '   Nettleseren sender æ, ø, å og mellomrom som koder: /api/økt blir /api/%C3%B8kt,\n' +
      '   og da finner ikke Express ruten din. Den svarer 404, og det er veldig vanskelig å se hvorfor.\n' +
      '   Bruk bare a–z, tall og _ i navnet på denne tabellen (for eksempel «okt» eller «treningsokt»).',
  );
});

test('Oppgave 5: tabellen har en id som primærnøkkel', () => {
  const t = hovedtabell();
  assert.ok(!t.feil, t.feil);

  const pk = t.kolonner.filter((k) => k.pk);

  assert.ok(
    pk.length > 0,
    `Tabellen «${t.navn}» har ingen primærnøkkel. Første kolonne bør være:\n` +
      '   id INTEGER PRIMARY KEY\n' +
      '   Da lager databasen id-en selv hver gang en rad legges til – også når den kommer fra skjemaet.',
  );

  assert.strictEqual(
    pk.length,
    1,
    `Tabellen «${t.navn}» har en sammensatt primærnøkkel (${pk.map((k) => k.navn).join(', ')}).\n` +
      '   Det passer for en koblingstabell, men ikke for hovedtabellen. Bruk én kolonne: id INTEGER PRIMARY KEY',
  );

  assert.strictEqual(
    pk[0].type,
    'INTEGER',
    `Primærnøkkelen «${pk[0].navn}» har typen ${pk[0].type || '(ingen)'}. Den må være INTEGER for at\n` +
      '   databasen skal lage den selv. Skriv: id INTEGER PRIMARY KEY',
  );
});

test('Oppgave 5: minst 5 kolonner i tillegg til id', () => {
  const t = hovedtabell();
  assert.ok(!t.feil, t.feil);

  assert.ok(
    t.felt.length >= 5,
    `Tabellen «${t.navn}» har ${t.felt.length} kolonner utenom id: ${t.felt.join(', ') || '(ingen)'}.\n` +
      '   Du trenger minst 5 – hver av dem blir et felt i skjemaet ditt senere.',
  );
});

test('Oppgave 5: minst 5 rader med data', () => {
  const t = hovedtabell();
  assert.ok(!t.feil, t.feil);

  assert.ok(
    t.rader >= 5,
    `Tabellen «${t.navn}» har ${t.rader} rader. Legg inn minst 5 med INSERT INTO ${t.navn} (...) VALUES (...);`,
  );
});

test('Ekstra ⭐: en tabell til, koblet med fremmednøkkel', (t) => {
  const { db, feil } = byggDb();
  if (feil) return t.skip('database.sql må virke først.');

  const medFk = tabeller(db).filter(
    (navn) => db.prepare(`PRAGMA foreign_key_list("${navn}")`).all().length > 0,
  );

  if (medFk.length === 0) {
    return t.skip('Ingen fremmednøkler ennå. Det er helt greit – dette er en ekstraoppgave.');
  }

  assert.ok(tabeller(db).length >= 2);
  assert.ok(kolonner(db, medFk[0]).length > 0);
});
