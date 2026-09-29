// Kontrakttesten for serveren din (oppgave 6 og 13).
//
// Denne testen er annerledes enn de andre: den later ikke som noe.
// Den snakker med DIN EGEN server, akkurat slik nettleseren gjør.
//
// Derfor må serveren kjøre. Åpne en NY terminal og kjør «npm run dev»,
// og la den stå. Kjør så, i den første terminalen:
//
//     npm run api
//
// NB: POST-testen legger inn én ekte rad i data.db, merket «(fra testen)».
// «npm run reset-db» fjerner den igjen.

import test, { after } from 'node:test';
import assert from 'node:assert';
import { hovedtabell } from './hjelp_db.js';

const BASE = 'http://localhost:3000';
const tabell = hovedtabell();

async function serverenSvarerIkke() {
  try {
    await fetch(BASE + '/', { signal: AbortSignal.timeout(2000) });
    return false; // alt i orden
  } catch (feil) {
    const kode = feil.cause?.code ?? feil.cause?.errors?.[0]?.code ?? feil.name;
    return kode === 'ECONNREFUSED' ? 'serveren kjører ikke' : `fikk ikke kontakt med serveren (${kode})`;
  }
}

const hoppOver = await serverenSvarerIkke();

// Forklaringen skrives ÉN gang, ikke på hver eneste test.
if (hoppOver) {
  console.log(
    [
      '',
      '  ┌─────────────────────────────────────────────────────────────────┐',
      '  │  Serveren din svarer ikke på http://localhost:3000.             │',
      '  │                                                                 │',
      '  │  Denne testen snakker med DIN EGEN server, så den må kjøre:     │',
      '  │                                                                 │',
      '  │    1. Åpne en NY terminal (Terminal → New Terminal)             │',
      '  │    2. Sjekk med «pwd» at du står i mappa min-side               │',
      '  │    3. Kjør «npm run dev», og la terminalen stå åpen             │',
      '  │    4. Kjør «npm run api» her igjen                              │',
      '  └─────────────────────────────────────────────────────────────────┘',
      '',
    ].join('\n'),
  );
}

// Uten denne blir hver kjøring hengende i noen sekunder etterpå, fordi
// fetch holder forbindelsen varm i tilfelle vi spør igjen.
after(() => globalThis[Symbol.for('undici.globalDispatcher.1')]?.close());

function adresse() {
  assert.ok(!tabell.feil, `Testen trenger database.sql for å vite hva tabellen din heter.\n   ${tabell.feil}`);
  return `/api/${tabell.navn}`;
}

// Leser svaret som JSON, eller forklarer hvorfor det ikke gikk.
async function lesJson(svar, hva) {
  const rå = await svar.text();
  try {
    return JSON.parse(rå);
  } catch {
    assert.fail(
      `${hva} svarte ikke med JSON. Fikk dette:\n     ${rå.slice(0, 120).replace(/\s+/g, ' ')}\n` +
        '   Bruk res.json(...) – ikke res.send(...).',
    );
  }
}

async function hentAlle() {
  const sti = adresse();
  const svar = await fetch(BASE + sti);

  assert.notStrictEqual(
    svar.status,
    404,
    `GET ${sti} svarte 404. Finnes ruten? Den skal stå i server.js:\n` +
      `     app.get('${sti}', (req, res) => { ... })\n` +
      '   Husk at serveren må startes på nytt etter endringer – «npm run dev» gjør det av seg selv.',
  );

  assert.strictEqual(
    svar.status,
    200,
    `GET ${sti} svarte ${svar.status}. Se i terminalen der serveren kjører – feilmeldingen står der.\n` +
      '   «no such table» betyr at du må kjøre «npm run reset-db».',
  );

  return lesJson(svar, `GET ${sti}`);
}

// ---------------------------------------------------------------

test('Oppgave 6: GET /api/<tabellen din> gir en liste', { skip: hoppOver }, async () => {
  const rader = await hentAlle();

  assert.ok(Array.isArray(rader), 'Svaret skal være en LISTE. Bruk .all() og send resultatet rett til res.json(...).');

  assert.ok(
    rader.length > 0,
    'Lista er tom. Har du kjørt «npm run reset-db» etter at du skrev database.sql?',
  );
});

test('Oppgave 6: radene har kolonnene fra tabellen din', { skip: hoppOver }, async () => {
  const rader = await hentAlle();
  assert.ok(Array.isArray(rader) && rader.length > 0, 'Få den første testen grønn først.');

  // En fremmednøkkel (⭐) kan godt være byttet ut med et navn via JOIN.
  const mangler = tabell.felt.filter((k) => !(k in rader[0]) && !tabell.fk.includes(k));

  assert.strictEqual(
    mangler.length,
    0,
    `Første rad mangler ${mangler.join(', ')}. Den hadde bare: ${Object.keys(rader[0]).join(', ')}.\n` +
      '   Ta med alle kolonnene i SELECT-en. (id kan du ta med eller la være.)',
  );
});

test('Oppgave 13: POST /api/<tabellen din> lagrer en rad og svarer 201', { skip: hoppOver }, async () => {
  const sti = adresse();
  const forrige = await hentAlle();
  assert.ok(Array.isArray(forrige) && forrige.length > 0, 'GET må virke før POST kan testes.');

  // Vi kopierer en rad du allerede har, så verdiene garantert er lov i
  // tabellen din. Første tekstverdi får et merke, så du ser hvor den kom fra.
  // Mangler en kolonne i GET-svaret (en fremmednøkkel du har JOINet bort),
  // henter vi verdien fra database.sql i stedet.
  const fraSql = tabell.db.prepare(`SELECT * FROM "${tabell.navn}" LIMIT 1`).get() ?? {};
  const ny = {};
  let merket = false;
  for (const k of tabell.felt) {
    let verdi = k in forrige[0] ? forrige[0][k] : fraSql[k];
    if (!merket && typeof verdi === 'string') {
      verdi = `${verdi} (fra testen)`;
      merket = true;
    }
    ny[k] = verdi;
  }

  const svar = await fetch(BASE + sti, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ny),
  });

  assert.notStrictEqual(
    svar.status,
    404,
    `POST ${sti} svarte 404. Finnes ruten? Den skal stå i server.js:\n` +
      `     app.post('${sti}', (req, res) => { ... })`,
  );

  assert.strictEqual(
    svar.status,
    201,
    `POST ${sti} svarte ${svar.status}. Den skal svare 201 («opprettet»): res.status(201).json(...)\n` +
      `   Testen sendte: ${JSON.stringify(ny)}\n` +
      '   Svarte den 500? Se i terminalen der serveren kjører. «cannot be bound» betyr at en av\n' +
      '   verdiene var undefined – sjekk at navnene i req.body er stavet som kolonnene.',
  );

  const etter = await hentAlle();

  assert.strictEqual(
    etter.length,
    forrige.length + 1,
    `Serveren svarte 201, men GET ${sti} gir fortsatt ${etter.length} rader. Ble raden faktisk lagt inn?\n` +
      '   Husk .run(...) etter db.prepare(...INSERT...).',
  );
});
