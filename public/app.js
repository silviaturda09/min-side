// Min side – denne fila er ferdig. Du skal jobbe i api.js og lag.js.
//
// Her kobles alt sammen. Legg merke til det som IKKE står her: ingen
// fetch (det er jobben til api.js) og ingen tabellrader (det er jobben
// til lag.js). Denne fila vet bare HVA som skal skje, og NÅR.
//
// Blir sida tom? Åpne konsollen (F12). Meldingene herfra er på norsk.

import { hentAlle, leggTil } from './api.js';
import { lagRad } from './lag.js';

// Avtalen med index.html: disse to id-ene må finnes.
const rader = document.querySelector('#rader');
const skjema = document.querySelector('#skjema');

// En feilmelding som én rad over hele tabellen.
function visFeil(tekst) {
  console.error(tekst);
  if (!rader) return;

  const tr = document.createElement('tr');
  const td = document.createElement('td');
  td.colSpan = 99;
  td.textContent = tekst;
  tr.append(td);
  rader.replaceChildren(tr);
}

async function visAlle() {
  if (!rader) {
    console.error('Fant ikke <tbody id="rader"> i index.html. Det er der radene skal inn (oppgave 8).');
    return;
  }

  try {
    const alle = await hentAlle();

    if (!Array.isArray(alle)) {
      throw new Error('hentAlle() ga ikke tilbake en liste. Har du skrevet oppgave 9 – med return?');
    }

    const nye = alle.map(lagRad);

    if (nye.some((tr) => !(tr instanceof Node))) {
      throw new Error('lagRad() ga ikke tilbake et element. Har du skrevet oppgave 10 – med return?');
    }

    rader.replaceChildren(...nye);
  } catch (feil) {
    visFeil(feil.message);
  }
}

if (skjema) {
  skjema.addEventListener('submit', async (hendelse) => {
    // Uten denne sender nettleseren skjemaet på gammelmåten: sida lastes
    // på nytt, og dataene havner i adresselinja i stedet for i databasen.
    hendelse.preventDefault();

    // Hvert felt blir én nøkkel, og nøkkelen er name-attributtet:
    // <input name="tittel"> blir { tittel: '...' }.
    const data = Object.fromEntries(new FormData(skjema));

    try {
      await leggTil(data);
      skjema.reset();
      await visAlle();
    } catch (feil) {
      visFeil(feil.message);
    }
  });
} else {
  console.info('Fant ikke <form id="skjema"> ennå. Det er helt greit til du kommer til oppgave 11.');
}

visAlle();
