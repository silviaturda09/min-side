// Ferdige tester for api.js og lag.js (oppgave 9, 10 og 14).
// Du skal ikke endre denne fila. Les den – den er oppskriften.
//
// Kjør:  npm run frontend
//
// Serveren trenger IKKE å kjøre. Testene bytter ut fetch med en
// liksom-server (hjelp.js) og document med en liksom-nettleser
// (liksom-dom.js). Begge skriver ned hva koden din gjorde, så testene
// kan si fra om HVORDAN du spurte og HVA du bygde – ikke bare om svaret.

import { test } from 'node:test';
import assert from 'node:assert';
import { fakeServer } from './hjelp.js';
import { liksomDocument, brukteInnerHTML } from './liksom-dom.js';
import { hovedtabell } from './hjelp_db.js';

globalThis.document = liksomDocument;

// Vi laster filene dine slik, i stedet for med vanlig import, så en
// skrivefeil gir en norsk melding i stedet for at hele fila krasjer.
async function last(fil) {
  try {
    return { modul: await import(fil) };
  } catch (feil) {
    return { feil: `${fil.replace('../', '')} har en feil, så testene får ikke lest den:\n   ${feil.message}` };
  }
}

const api = await last('../public/api.js');
const lag = await last('../public/lag.js');

// Testene bruker kolonnene fra DIN tabell når de lager eksempeldata.
const tabell = hovedtabell();

function eksempelRad(nr) {
  if (tabell.feil) return { tittel: `Spill ${nr}`, plattform: 'Switch', timer: 40 + nr };

  const rad = {};
  for (const k of tabell.kolonner.filter((kol) => !kol.pk)) {
    if (k.type.includes('INT')) rad[k.navn] = 10 * nr + 1;
    else if (k.type.includes('REAL') || k.type.includes('NUM')) rad[k.navn] = nr + 0.5;
    else rad[k.navn] = `${k.navn} ${nr}`;
  }
  return rad;
}

const LISTE = [eksempelRad(1), eksempelRad(2)];

function adresse() {
  assert.ok(
    !tabell.feil,
    `Testen trenger database.sql for å vite hva tabellen din heter.\n   ${tabell.feil}`,
  );
  return `/api/${tabell.navn}`;
}

function ruter(overstyr = {}) {
  const sti = adresse();
  return {
    [`GET ${sti}`]: { kropp: LISTE },
    [`POST ${sti}`]: { status: 201, kropp: { id: 3, ...eksempelRad(3) } },
    ...overstyr,
  };
}

// Henter en av funksjonene dine, eller stopper testen med en forklaring.
function funksjon(navn) {
  const [fil, modul] = navn === 'lagRad' ? ['lag.js', lag] : ['api.js', api];
  assert.ok(!modul.feil, modul.feil);
  assert.strictEqual(typeof modul.modul[navn], 'function', `Fant ingen «export function ${navn}» i ${fil}.`);
  return modul.modul[navn];
}

// Kjør en funksjon som kanskje kaster, og ta vare på feilen til senere.
async function prov(fn) {
  try {
    return { svar: await fn() };
  } catch (feil) {
    return { feil };
  }
}

// ---------------------------------------------------------------
// Oppgave 0 – filene finnes, og har funksjonene de skal ha
// ---------------------------------------------------------------

test('Oppgave 0: api.js og lag.js har funksjonene app.js bruker', () => {
  assert.ok(!api.feil, api.feil);
  assert.ok(!lag.feil, lag.feil);

  for (const [navn, modul, fil] of [
    ['hentAlle', api.modul, 'api.js'],
    ['leggTil', api.modul, 'api.js'],
    ['lagRad', lag.modul, 'lag.js'],
  ]) {
    assert.strictEqual(
      typeof modul[navn],
      'function',
      `Fant ingen funksjon som heter ${navn} i ${fil}. app.js importerer den, så navnet må stå\n` +
        `   akkurat slik – og det må stå «export» foran: export async function ${navn}(...)`,
    );
  }
});

// ---------------------------------------------------------------
// Oppgave 9 – hentAlle
// ---------------------------------------------------------------

test('Oppgave 9: hentAlle spør etter /api/<tabellen din>', async (t) => {
  const hentAlle = funksjon('hentAlle');
  const kall = fakeServer(t, ruter());
  const sti = adresse();
  const { feil } = await prov(() => hentAlle());

  assert.strictEqual(kall.length, 1, 'hentAlle skal kalle fetch én gang. Står det fortsatt bare // TODO?');

  assert.strictEqual(
    kall[0].sti,
    sti,
    `Du spurte etter «${kall[0].adresse}». Tabellen din heter «${tabell.navn}», så adressen skal være ${sti}.`,
  );

  assert.ok(
    kall[0].adresse.startsWith('/'),
    `Du spurte etter «${kall[0].adresse}». Skriv bare ${sti}, uten http://localhost:3000 foran.\n` +
      '   Da virker sida på hvilken som helst port – og på maskinen til den som kloner repoet ditt.',
  );

  assert.strictEqual(kall[0].metode, 'GET', `hentAlle skal bruke GET, men sendte ${kall[0].metode}.`);

  if (feil) assert.fail(feil.message);
});

test('Oppgave 9: hentAlle gir tilbake lista fra serveren', async (t) => {
  const hentAlle = funksjon('hentAlle');
  fakeServer(t, ruter());
  const { svar, feil } = await prov(() => hentAlle());

  if (feil) assert.fail(feil.message);

  assert.ok(
    Array.isArray(svar),
    `hentAlle ga tilbake ${svar === undefined ? 'undefined' : typeof svar}, ikke en liste.\n` +
      '   Har du husket return? Og husket å pakke ut JSON-en: return svar.json()',
  );

  assert.deepStrictEqual(svar, LISTE, 'Lista skal være nøyaktig det serveren sendte, uten endringer.');
});

test('Oppgave 9: hentAlle kaster en feil når serveren svarer 500', async (t) => {
  const hentAlle = funksjon('hentAlle');
  fakeServer(t, ruter({ [`GET ${adresse()}`]: { status: 500, kropp: { feil: 'Databasen svarer ikke.' } } }));
  const { feil } = await prov(() => hentAlle());

  assert.ok(
    feil,
    'Serveren svarte 500, men hentAlle kastet ingen feil. fetch kaster IKKE av seg selv når\n' +
      '   noe går galt på serveren – du må sjekke selv:\n' +
      '     if (!svar.ok) throw new Error(...)',
  );

  assert.ok(
    typeof feil.message === 'string' && feil.message.trim() !== '',
    'Feilen må ha en melding som forklarer hva som skjedde: throw new Error("...")',
  );
});

// ---------------------------------------------------------------
// Oppgave 10 – lagRad
// ---------------------------------------------------------------

function byggRad(rad) {
  const tr = funksjon('lagRad')(rad);

  assert.ok(
    tr !== undefined,
    'lagRad ga tilbake undefined. Husk return tr; helt til slutt i funksjonen.',
  );

  assert.ok(
    typeof tr !== 'string',
    'lagRad ga tilbake TEKST, ikke et element. Lag elementene med document.createElement(\'tr\')\n' +
      '   og document.createElement(\'td\'), og returner tr-elementet.',
  );

  assert.ok(tr && typeof tr === 'object' && 'tagName' in tr, 'lagRad skal returnere et element laget med document.createElement.');

  return tr;
}

test('Oppgave 10: lagRad lager en <tr>', () => {
  const tr = byggRad(eksempelRad(1));

  assert.strictEqual(
    tr.tagName,
    'TR',
    `lagRad ga tilbake en <${tr.tagName.toLowerCase()}>. En tabellrad er en <tr>.`,
  );
});

test('Oppgave 10: lagRad bruker textContent, ikke innerHTML', () => {
  const farlig = '<img src=x onerror="alert(\'hei\')">';
  const rad = eksempelRad(1);
  const forsteNokkel = Object.keys(rad)[0];
  rad[forsteNokkel] = farlig;

  const tr = byggRad(rad);

  assert.ok(
    !brukteInnerHTML(tr),
    'Du brukte innerHTML. Da tolker nettleseren teksten fra databasen som HTML.\n' +
      `   Noen kan skrive ${farlig} i skjemaet ditt – og da kjører koden\n` +
      '   deres hos alle som åpner sida. Det heter XSS, og vi kommer tilbake til det.\n' +
      '   Bruk textContent: da blir teksten alltid bare tekst.',
  );

  const forste = tr.elementer[0];

  assert.ok(forste, 'Raden har ingen celler. Lag én <td> per verdi og legg dem inn med tr.append(td).');

  assert.strictEqual(
    forste.textContent,
    farlig,
    'Teksten i første celle skal være nøyaktig det som sto i dataene – også når det ser ut som HTML.',
  );
});

test('Oppgave 10: én celle per verdi, i riktig rekkefølge', () => {
  const rad = eksempelRad(2);
  const verdier = Object.values(rad);
  const tr = byggRad(rad);

  if (brukteInnerHTML(tr)) {
    assert.fail('Raden er bygget med innerHTML. Få testen over (textContent) grønn først.');
  }

  const celler = tr.elementer;

  assert.strictEqual(
    celler.length,
    verdier.length,
    `Raden har ${celler.length} celler, men objektet har ${verdier.length} verdier. Lag én <td> per verdi –\n` +
      '   en løkke over Object.values(rad) gjør det for deg.',
  );

  celler.forEach((celle, i) => {
    assert.ok(
      celle.tagName === 'TD' || (i === 0 && celle.tagName === 'TH'),
      `Celle nr. ${i + 1} er en <${celle.tagName.toLowerCase()}>. Cellene i en rad skal være <td>.`,
    );

    assert.strictEqual(
      celle.textContent,
      String(verdier[i]),
      `Celle nr. ${i + 1} inneholder «${celle.textContent}», men skulle inneholdt «${verdier[i]}».\n` +
        '   Står verdiene i samme rekkefølge som i objektet?',
    );
  });
});

test('Ekstra ⭐: første celle er overskriften for raden', (t) => {
  const tr = lag.modul?.lagRad?.(eksempelRad(1));
  if (!tr?.elementer) return t.skip('Gjør oppgave 10 først.');

  const forste = tr.elementer[0];

  if (forste?.tagName !== 'TH') {
    return t.skip('Første celle er en <td>. Det er helt riktig – dette er en ekstraoppgave.');
  }

  assert.strictEqual(
    forste.scope,
    'row',
    'Når første celle er en <th>, må den ha scope="row". Da vet en skjermleser at den er\n' +
      '   overskriften for resten av raden:  th.scope = \'row\';',
  );
});

// ---------------------------------------------------------------
// Oppgave 14 – leggTil
// ---------------------------------------------------------------

test('Oppgave 14: leggTil sender en POST med JSON', async (t) => {
  const leggTil = funksjon('leggTil');
  const kall = fakeServer(t, ruter());
  const sti = adresse();
  const ny = eksempelRad(3);
  const { feil } = await prov(() => leggTil(ny));

  assert.strictEqual(kall.length, 1, 'leggTil skal kalle fetch én gang. Står det fortsatt bare // TODO?');

  const k = kall[0];

  // Rekkefølgen under er med vilje: du får alltid den FØRSTE tingen som er
  // gal, aldri en følgefeil av noe lenger oppe.

  assert.strictEqual(k.sti, sti, `Du sendte til «${k.adresse}». Adressen skal være ${sti}.`);

  assert.strictEqual(
    k.metode,
    'POST',
    `Du sendte en ${k.metode}. En POST må du be om selv: fetch(adresse, { method: 'POST', ... })`,
  );

  const ct = k.headere.get('content-type');

  assert.ok(
    ct !== null && ct.startsWith('application/json'),
    `Du sendte ${ct === null ? 'ingen Content-Type' : `Content-Type «${ct}»`}.\n` +
      '   express.json() på serveren leser bare body når du sier at det er JSON:\n' +
      "   headers: { 'Content-Type': 'application/json' }",
  );

  assert.strictEqual(
    typeof k.kropp,
    'string',
    'body må være TEKST. fetch kan ikke sende et objekt direkte – gjør det om med JSON.stringify(rad).',
  );

  let sendt;
  try {
    sendt = JSON.parse(k.kropp);
  } catch {
    assert.fail(`body var «${k.kropp}», og det er ikke gyldig JSON. Bruk JSON.stringify(rad).`);
  }

  assert.deepStrictEqual(sendt, ny, 'body skal være nøyaktig objektet leggTil fikk inn – ikke noe mer, ikke noe mindre.');

  if (feil) assert.fail(feil.message);
});

test('Oppgave 14: leggTil gir tilbake raden serveren lagret', async (t) => {
  const leggTil = funksjon('leggTil');
  fakeServer(t, ruter());
  const { svar, feil } = await prov(() => leggTil(eksempelRad(3)));

  if (feil) assert.fail(feil.message);

  assert.deepStrictEqual(
    svar,
    { id: 3, ...eksempelRad(3) },
    'leggTil skal gi tilbake det serveren svarte – raden slik den ble lagret, med id. Husk return svar.json()',
  );
});

test('Oppgave 14: leggTil kaster en feil når serveren svarer 400', async (t) => {
  const leggTil = funksjon('leggTil');
  fakeServer(t, ruter({ [`POST ${adresse()}`]: { status: 400, kropp: { feil: 'Mangler tittel.' } } }));
  const { feil } = await prov(() => leggTil({}));

  assert.ok(
    feil,
    'Serveren svarte 400, men leggTil kastet ingen feil. Da tror brukeren at alt gikk bra.\n' +
      '   Sjekk svar.ok her også:  if (!svar.ok) throw new Error(...)',
  );
});
