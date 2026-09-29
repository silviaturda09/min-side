// Ferdige tester for oppgave 1–4, og for commit-vanene dine hele veien.
// Du skal ikke endre denne fila. Les den – den er oppskriften.
//
// Kjør:  npm run git
//
// Testene spør git om historikken din, akkurat som når du skriver
// «git log» selv. De endrer ingenting.

import { test } from 'node:test';
import assert from 'node:assert';
import { execFileSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const MAPPE = realpathSync(fileURLToPath(new URL('..', import.meta.url)));

function git(...argumenter) {
  return execFileSync('git', argumenter, {
    cwd: MAPPE,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

// Finnes git i det hele tatt, og er mappa et repo?
let toppmappe = null;
let hoppOver = false;

try {
  toppmappe = realpathSync(git('rev-parse', '--show-toplevel'));
} catch (feil) {
  // På en Mac uten utviklerverktøy finnes «git», men den ber bare om å
  // bli installert. Det er det samme som at git mangler.
  const mangler = feil.code === 'ENOENT' || /xcrun|developer tools/i.test(String(feil.stderr ?? ''));
  hoppOver = mangler ? 'git er ikke installert' : 'mappa er ikke et git-repo ennå';
}

// Ligger repoet i en mappe OVER prosjektet, ville testene under lest
// historikken til noe helt annet. Da stopper vi etter oppgave 1.
const feilMappe = !hoppOver && toppmappe !== MAPPE;
const hoppOverResten = hoppOver || (feilMappe && 'repoet starter i en annen mappe – se oppgave 1');

if (hoppOver) {
  const linjer =
    hoppOver === 'git er ikke installert'
      ? [
          '  │  Fant ikke git på maskinen.                                     │',
          '  │                                                                 │',
          '  │  Mac:      skriv «git --version» i terminalen og velg Installer │',
          '  │  Windows:  last ned Git for Windows fra git-scm.com             │',
        ]
      : [
          '  │  Denne mappa er ikke et git-repo ennå. Da er det ingen          │',
          '  │  historikk å sjekke, så git-testene hopper over seg selv.       │',
          '  │                                                                 │',
          '  │    1. Sjekk med «pwd» at du står i mappa min-side               │',
          '  │    2. Kjør «git init -b main»                                   │',
          '  │    3. Kjør «npm run git» her igjen                              │',
        ];

  console.log(
    [
      '',
      '  ┌─────────────────────────────────────────────────────────────────┐',
      ...linjer,
      '  └─────────────────────────────────────────────────────────────────┘',
      '',
    ].join('\n'),
  );
}

// Meldinger som ikke sier noe om HVA som ble gjort. Består en melding
// bare av slike ord, teller den ikke.
const FYLLORD = new Set([
  'update', 'updates', 'updated', 'fix', 'fixes', 'fixed', 'asdf', 'test', 'wip',
  'commit', 'changes', 'change', 'stuff', 'small', 'minor', 'more', 'new', 'ok',
  'endring', 'endringer', 'oppdatering', 'oppdatert', 'ferdig', 'diverse', 'liten',
  'litt', 'mer', 'ny', 'nye', 'fikset', 'fiks',
]);

function erGodMelding(melding) {
  const ord = melding
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);

  return ord.length >= 2 && !ord.every((o) => FYLLORD.has(o));
}

// ---------------------------------------------------------------

test('Oppgave 1: min-side er et eget git-repo', { skip: hoppOver }, () => {
  assert.strictEqual(
    toppmappe,
    MAPPE,
    `Repoet ditt starter i\n     ${toppmappe}\n   men prosjektet ligger i\n     ${MAPPE}\n` +
      '   Du har sannsynligvis kjørt «git init» i feil mappe. Ikke commit noe nå – rop på læreren.',
  );
});

test('Oppgave 2: data.db og node_modules er ikke med i repoet', { skip: hoppOverResten }, () => {
  const filer = git('ls-files').split('\n').filter(Boolean);

  assert.ok(
    !filer.some((f) => f.startsWith('node_modules/')),
    'node_modules er med i repoet. Den mappa lages av «npm install», og kan være på flere tusen filer.\n' +
      '   Sjekk at .gitignore ligger i prosjektmappa, og kjør:  git rm -r --cached node_modules',
  );

  assert.ok(
    !filer.includes('data.db'),
    'data.db er med i repoet. Den bygges fra database.sql med «npm run reset-db» –\n' +
      '   vi committer oppskriften, ikke kaka. Kjør:  git rm --cached data.db',
  );
});

test('Oppgave 3: README-en forteller hva prosjektet er', () => {
  const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
  const igjen = (readme.match(/skriv her/gi) ?? []).length;

  assert.strictEqual(
    igjen,
    0,
    `README.md har fortsatt ${igjen} steder der det står «skriv her». Fyll inn navn, tema,\n` +
      '   hvem sida er for, og hva brukeren kan gjøre der.',
  );
});

test('Oppgave 4: den utfylte README-en er committet', { skip: hoppOverResten }, () => {
  let committet;

  try {
    committet = git('show', 'HEAD:README.md');
  } catch {
    assert.fail('Fant ingen README.md i siste commit. Har du committet noe ennå? Sjekk med «git log --oneline».');
  }

  assert.ok(
    !/skriv her/i.test(committet),
    'README-en er fylt ut på disken, men ikke committet. Det git har lagret, er fortsatt malen.\n' +
      '   git add README.md\n' +
      '   git commit -m "Beskriver temaet og hvem sida er for"',
  );
});

test('Hele veien: minst 5 commits som sier hva du gjorde', { skip: hoppOverResten }, () => {
  let meldinger;

  try {
    meldinger = git('log', '--format=%s').split('\n').filter(Boolean);
  } catch {
    assert.fail('Du har ingen commits ennå. Den første lager du i oppgave 2.');
  }

  const gode = meldinger.filter(erGodMelding);
  const darlige = meldinger.filter((m) => !erGodMelding(m));

  let forklaring = `Du har ${gode.length} commits som teller, og trenger minst 5.`;

  if (darlige.length > 0) {
    forklaring +=
      `\n   Disse teller ikke, fordi de ikke sier hva som ble gjort: ${darlige.map((m) => `«${m}»`).join(', ')}` +
      '\n   En god melding fullfører setningen «Denne commiten …», for eksempel «Legger til tabell for spill».' +
      '\n   Du trenger ikke rette de gamle – bare skriv bedre meldinger videre.';
  }

  assert.ok(gode.length >= 5, forklaring);
});
