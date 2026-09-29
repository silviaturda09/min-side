// Ferdige tester for index.html (oppgave 8, 11 og 12).
// Du skal ikke endre denne fila. Les den – den er oppskriften.
//
// Kjør:  npm run html
//
// Alt her leser public/index.html som tekst. Ingenting ser på utseendet –
// bare på strukturen, og på avtalene med app.js og med databasen din.

import { test } from 'node:test';
import assert from 'node:assert';
import { lesSide, tagger, harTagg, innhold, overskrifter, omrader, ligger, tekst, felt, beskriv } from './hjelp_html.js';
import { hovedtabell } from './hjelp_db.js';

// Området mellom <form id="skjema"> og </form>, eller null.
function skjemaet(html) {
  return omrader(html, 'form').find((f) => f.attributter.id === 'skjema') ?? null;
}

function skjemaFelt(html) {
  const skjema = skjemaet(html);

  assert.ok(
    skjema,
    'Fant ingen <form id="skjema">. app.js leter etter akkurat den id-en for å vite hvilket skjema\n' +
      '   den skal lytte på.',
  );

  const alle = felt(html, skjema);

  assert.ok(alle.length > 0, 'Skjemaet har ingen felt ennå. Legg til <input>, <select> eller <textarea>.');

  return alle;
}

// ---------------------------------------------------------------
// Oppgave 0 – avtalen med app.js
// ---------------------------------------------------------------

test('Oppgave 0: sida laster app.js som en modul', () => {
  const skript = tagger(lesSide(), 'script').find((t) => (t.attributter.src ?? '').includes('app.js'));

  assert.ok(skript, 'Fant ingen <script src="app.js">. Uten den kjører ikke JavaScript-en i det hele tatt.');
  assert.strictEqual(
    skript.attributter.type,
    'module',
    'Script-taggen mangler type="module". app.js bruker import, og uten module nekter nettleseren\n' +
      '   å kjøre den: «Cannot use import statement outside a module».',
  );
});

// ---------------------------------------------------------------
// Oppgave 8 – struktur og tabell
// ---------------------------------------------------------------

test('Oppgave 8: sida har språk, én h1 og landemerker', () => {
  const html = lesSide();

  assert.ok(
    (tagger(html, 'html')[0]?.attributter.lang ?? '').trim() !== '',
    'Mangler lang på <html>. Skriv <html lang="no">, så skjermlesere velger riktig uttale.',
  );

  const h1 = overskrifter(html).filter((o) => o.nivå === 1);

  assert.strictEqual(
    h1.length,
    1,
    `Sida har ${h1.length} <h1>. Den skal ha nøyaktig én – navnet på sida.`,
  );

  for (const landemerke of ['header', 'main', 'footer']) {
    assert.ok(
      harTagg(html, landemerke),
      `Sida mangler <${landemerke}>. En side har tre faste rom: <header> øverst, <main> med innholdet,\n` +
        '   og <footer> nederst.',
    );
  }
});

test('Oppgave 8: tabellen har en overskrift i <caption>', () => {
  const html = lesSide();

  assert.ok(harTagg(html, 'table'), 'Fant ingen <table>. Det er der dataene fra databasen skal vises.');

  assert.ok(
    tekst(innhold(html, 'caption')) !== '',
    'Tabellen mangler <caption>, eller den er tom. <caption> er tabellens overskrift, og den\n' +
      '   skal stå rett etter <table>. En skjermleser leser den opp før den leser tallene.',
  );
});

test('Oppgave 8: kolonneoverskriftene står i <thead> med scope="col"', () => {
  const html = lesSide();
  const hode = innhold(html, 'thead');

  assert.ok(hode !== null, 'Tabellen mangler <thead>. Kolonneoverskriftene skal stå der, i én <tr>.');

  const th = tagger(hode, 'th');

  assert.ok(th.length > 0, '<thead> har ingen <th>. Hver kolonneoverskrift er en <th>, ikke en <td>.');

  const uten = th.filter((t) => t.attributter.scope !== 'col').length;

  assert.strictEqual(
    uten,
    0,
    `${uten} av ${th.length} <th> i <thead> mangler scope="col". Det er det som gjør at en skjermleser kan si\n` +
      '   «Tittel: Zelda» når den leser en rad, i stedet for bare «Zelda».',
  );
});

test('Oppgave 8: tabellen har en tom <tbody id="rader">', () => {
  const html = lesSide();
  const n = tagger(html, 'tbody').findIndex((t) => t.attributter.id === 'rader');

  assert.ok(
    n !== -1,
    'Fant ingen <tbody id="rader">. app.js leter etter akkurat den id-en – det er der den\n' +
      '   legger radene den bygger. Heter den noe annet, blir tabellen tom.',
  );

  assert.strictEqual(
    innhold(html, 'tbody', n).trim(),
    '',
    '<tbody id="rader"> har innhold. La den stå tom – app.js fyller den med rader fra databasen,\n' +
      '   og det du skriver der selv blir visket ut i det sida lastes.',
  );
});

// ---------------------------------------------------------------
// Oppgave 11 – skjemaet snakker med databasen
// ---------------------------------------------------------------

test('Oppgave 11: skjemaet har id="skjema" og felt', () => {
  skjemaFelt(lesSide());
});

test('Oppgave 11: alle felt har name', () => {
  const uten = skjemaFelt(lesSide()).filter((f) => !(f.attributter.name ?? '').trim());

  assert.strictEqual(
    uten.length,
    0,
    `Disse feltene mangler name: ${uten.map(beskriv).join(', ')}.\n` +
      '   Et felt uten name blir ikke sendt med i det hele tatt. name blir nøkkelen i JSON-en\n' +
      '   app.js sender til serveren – og serveren trenger den for å vite hvilken kolonne verdien hører til.',
  );
});

test('Oppgave 11: hvert name er en kolonne i tabellen din', () => {
  const t = hovedtabell();
  assert.ok(!t.feil, `Testen trenger database.sql for å vite hvilke kolonner du har.\n   ${t.feil}`);

  const navn = [...new Set(skjemaFelt(lesSide()).map((f) => f.attributter.name).filter(Boolean))];

  if (t.id && navn.includes(t.id)) {
    assert.fail(
      `Skjemaet har et felt med name="${t.id}". Den lager databasen selv hver gang en rad legges til –\n` +
        '   brukeren skal ikke fylle den ut. Ta bort feltet.',
    );
  }

  const ukjente = navn.filter((n) => !t.felt.includes(n));

  assert.strictEqual(
    ukjente.length,
    0,
    `Disse name-ene finnes ikke som kolonner i «${t.navn}»: ${ukjente.join(', ')}.\n` +
      `   Kolonnene du har, er: ${t.felt.join(', ')}.\n` +
      '   name er avtalen hele veien ned til databasen: name="tittel" blir { tittel: ... },\n' +
      '   som blir req.body.tittel, som blir kolonnen tittel. Store og små bokstaver teller.',
  );
});

test('Oppgave 11: alle felt har en ledetekst i <label>', () => {
  const html = lesSide();
  const alle = skjemaFelt(html);
  const labels = omrader(html, 'label');
  const forId = new Set(labels.map((l) => l.attributter.for).filter(Boolean));

  const uten = alle.filter((f) => {
    const id = f.attributter.id;
    const viaFor = id && forId.has(id);
    const inni = labels.some((l) => ligger(f, l));
    return !viaFor && !inni;
  });

  assert.strictEqual(
    uten.length,
    0,
    `Disse feltene har ingen <label>: ${uten.map(beskriv).join(', ')}.\n` +
      '   To lovlige måter:\n' +
      '     <label for="tittel">Tittel</label> <input id="tittel" name="tittel">   (for og id helt like)\n' +
      '     <label><input type="radio" name="status" value="ferdig"> Ferdig</label>   (feltet inni)\n' +
      '   En placeholder er ikke en ledetekst – den forsvinner i det brukeren begynner å skrive.',
  );
});

// ---------------------------------------------------------------
// Oppgave 12 – skjemaet passer brukeren
// ---------------------------------------------------------------

test('Oppgave 12: minst 5 ulike felttyper', () => {
  const typer = [...new Set(skjemaFelt(lesSide()).map((f) => f.type))];

  assert.ok(
    typer.length >= 5,
    `Skjemaet bruker ${typer.length} felttype${typer.length === 1 ? '' : 'r'}: ${typer.join(', ')}.\n` +
      '   Velg typen etter hva brukeren skal skrive inn: number, date, email, range, select,\n' +
      '   radio, textarea … På mobil gir hver type sitt eget tastatur.',
  );
});

test('Oppgave 12: radioknappene står i en <fieldset> med <legend>', () => {
  const html = lesSide();
  const radio = skjemaFelt(html).filter((f) => f.type === 'radio');

  assert.ok(
    radio.length >= 2,
    'Skjemaet har ingen gruppe med radioknapper. Lag en når brukeren skal velge ÉN av noen få\n' +
      '   faste verdier – alle knappene i gruppa har samme name, men hver sin value.',
  );

  const bokser = omrader(html, 'fieldset');

  for (const r of radio) {
    const boks = bokser.find((b) => ligger(r, b));

    assert.ok(
      boks,
      `Radioknappen med name="${r.attributter.name}" og value="${r.attributter.value}" står ikke i en <fieldset>.\n` +
        '   Hver knapp har sin egen <label> («Ferdig»), men gruppa trenger også et spørsmål\n' +
        '   («Status»). Det er jobben til <fieldset> og <legend>.',
    );

    assert.ok(
      tagger(html.slice(boks.fra, boks.slutt), 'legend').length > 0,
      '<fieldset> rundt radioknappene mangler <legend>. <legend> er spørsmålet gruppa svarer på,\n' +
        '   og skal stå rett etter <fieldset>.',
    );
  }
});

test('Oppgave 12: minst ett felt er påkrevd', () => {
  const pakrevd = skjemaFelt(lesSide()).filter((f) => 'required' in f.attributter);

  assert.ok(
    pakrevd.length > 0,
    'Ingen felt har required. Hvilket felt gir ingen mening å la stå tomt? Legg required på det,\n' +
      '   så nekter nettleseren å sende skjemaet før det er fylt ut.',
  );
});

test('Oppgave 12: skjemaet har en knapp som sender det', () => {
  const html = lesSide();
  const skjema = skjemaet(html);
  assert.ok(skjema, 'Fant ingen <form id="skjema">.');

  const knapper = [
    ...tagger(html, 'button').filter((b) => ['', 'submit'].includes((b.attributter.type ?? '').toLowerCase())),
    ...tagger(html, 'input').filter((i) => (i.attributter.type ?? '').toLowerCase() === 'submit'),
  ].filter((k) => ligger(k, skjema));

  assert.ok(
    knapper.length > 0,
    'Skjemaet har ingen knapp som sender det. Legg en <button>Legg til</button> nederst i <form>.\n' +
      '   (En <button type="button"> sender ikke – den gjør ingenting uten JavaScript.)',
  );
});
