// Hjelpefil for HTML-testene. Denne fila skal du ikke endre –
// men du har lov (og godt av) å lese den.
//
// Node har ingen nettleser i seg, så den kan ikke lage et DOM-tre av
// HTML-en din. Derfor leser vi fila som tekst og plukker ut taggene
// med mønstre. Det holder godt til det vi skal sjekke her.

import { readFileSync } from 'node:fs';

const FIL = new URL('../public/index.html', import.meta.url);

// Leser index.html og fjerner kommentarer, så en <tagg> inne i en
// kommentar ikke teller som om den stod i sida.
export function lesSide() {
  return readFileSync(FIL, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
}

function lesAttributter(tekst) {
  const attributter = {};
  const m = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let treff;

  while ((treff = m.exec(tekst)) !== null) {
    attributter[treff[1].toLowerCase()] = treff[2] ?? treff[3] ?? treff[4] ?? '';
  }

  return attributter;
}

// Alle forekomster av én tagg, med attributtene sine.
// tagger(html, 'section') -> [{ attributter: { id: 'liste-panel' }, fra, til }]
export function tagger(html, navn) {
  const m = new RegExp(`<${navn}(?=[\\s/>])([^>]*)>`, 'gi');
  const funnet = [];
  let treff;

  while ((treff = m.exec(html)) !== null) {
    funnet.push({
      attributter: lesAttributter(treff[1]),
      fra: treff.index,
      til: treff.index + treff[0].length,
    });
  }

  return funnet;
}

export function harTagg(html, navn) {
  return tagger(html, navn).length > 0;
}

// Innholdet mellom <navn> og den tilhørende </navn>, for forekomst nr n.
// Teller nøstede tagger, så en <section> inni en <section> gir riktig svar.
export function innhold(html, navn, n = 0) {
  const start = tagger(html, navn)[n];
  if (!start) return null;

  const m = new RegExp(`<(/?)${navn}(?=[\\s/>])[^>]*>`, 'gi');
  m.lastIndex = start.til;

  let dybde = 1;
  let treff;

  while ((treff = m.exec(html)) !== null) {
    dybde += treff[1] === '/' ? -1 : 1;
    if (dybde === 0) return html.slice(start.til, treff.index);
  }

  return html.slice(start.til); // taggen ble aldri lukket
}

// Alle overskrifter i rekkefølge: [{ nivå: 1, tekst: 'MusicFinder' }, ...]
export function overskrifter(html) {
  const m = /<h([1-6])(?=[\s/>])[^>]*>([\s\S]*?)<\/h\1\s*>/gi;
  const funnet = [];
  let treff;

  while ((treff = m.exec(html)) !== null) {
    funnet.push({
      nivå: Number(treff[1]),
      tekst: treff[2].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(),
    });
  }

  return funnet;
}

// Alle id-er som finnes i sida.
export function idEr(html) {
  const m = /\sid\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/gi;
  const funnet = new Set();
  let treff;

  while ((treff = m.exec(html)) !== null) {
    funnet.add(treff[1] ?? treff[2] ?? treff[3]);
  }

  return funnet;
}

// Hvor et helt element starter og slutter, fra <navn> til og med </navn>.
// Brukes til å finne ut om noe ligger INNI noe annet – et felt inni en
// <label>, eller en radioknapp inni en <fieldset>.
export function omrader(html, navn) {
  return tagger(html, navn).map((start, n) => {
    const inni = innhold(html, navn, n) ?? '';
    const slutt = html.indexOf('>', start.til + inni.length);
    return { ...start, slutt: slutt === -1 ? html.length : slutt + 1 };
  });
}

export function ligger(element, omrade) {
  return element.fra > omrade.fra && element.fra < omrade.slutt;
}

// Tekst uten tagger og ekstra mellomrom.
export function tekst(html) {
  return (html ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

// Feltene brukeren kan fylle ut i et område: input, select og textarea.
// Knapper og skjulte felt teller ikke.
// [{ tagg: 'input', type: 'date', attributter: {...}, fra, til }, ...]
const IKKE_FELT = new Set(['submit', 'button', 'reset', 'hidden', 'image']);

export function felt(html, omrade = { fra: -1, slutt: html.length }) {
  const alle = [
    ...tagger(html, 'input').map((t) => ({ ...t, tagg: 'input', type: (t.attributter.type || 'text').toLowerCase() })),
    ...tagger(html, 'select').map((t) => ({ ...t, tagg: 'select', type: 'select' })),
    ...tagger(html, 'textarea').map((t) => ({ ...t, tagg: 'textarea', type: 'textarea' })),
  ];

  return alle
    .filter((f) => ligger(f, omrade) && !IKKE_FELT.has(f.type))
    .sort((a, b) => a.fra - b.fra);
}

// Et navn å bruke om feltet i en feilmelding.
export function beskriv(f) {
  const a = f.attributter;
  if (a.name) return `feltet med name="${a.name}"`;
  if (a.id) return `feltet med id="${a.id}"`;
  return `et <${f.tagg}${f.tagg === 'input' ? ` type="${f.type}"` : ''}>-felt`;
}
