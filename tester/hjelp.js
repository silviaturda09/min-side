// Hjelpefil for testene. Denne fila skal du ikke endre –
// men du har lov (og godt av) å lese den.
//
// fakeServer bytter ut fetch med en liten «liksom-server». Den går aldri
// på nettet. Den svarer med ferdiglagde data, og den skriver samtidig ned
// HVORDAN du spurte: adressen, metoden, headerne og innholdet.
//
// Derfor kan testene si fra om noe mer enn «feil svar» – de kan si
// «du spurte om feil adresse», eller «du glemte å si at du sender JSON».
//
// Den ekte fetch kommer tilbake av seg selv når testen er ferdig.

// Vi tar vare på den ekte fetch ÉN gang, når fila lastes. Da kan ikke to
// tester oppå hverandre ende med å «gjenopprette» en falsk fetch.
const EKTE_FETCH = globalThis.fetch;

// Brukes bare til å plukke adressen din fra hverandre, slik at en relativ
// adresse som /api/spill også kan leses. Ingenting går på nett.
const BASE = 'http://liksom.test';

export function fakeServer(t, ruter) {
  const kall = [];

  globalThis.fetch = async (input, init = {}) => {
    const adresse = typeof input === 'string' ? input : (input?.url ?? String(input));
    const url = new URL(adresse, BASE);
    const metode = String(init.method ?? 'GET').toUpperCase();

    kall.push({
      adresse,                  // nøyaktig teksten du ga til fetch
      sti: url.pathname,        // adressen uten ?spørring
      q: url.searchParams,      // spørringen, ferdig avkodet
      metode,
      headere: new Headers(init.headers ?? {}),
      kropp: init.body,         // rått, slik du sendte det
    });

    const rute = ruter[`${metode} ${url.pathname}`];

    if (!rute) {
      throw new Error(
        `Liksom-serveren i testen fikk «${metode} ${url.pathname}», og den adressen finnes ikke.\n` +
          `   Adressene den kjenner er:\n     ${Object.keys(ruter).join('\n     ')}\n` +
          `   Sjekk at adressen din er stavet helt likt.`,
      );
    }

    // Nytt Response-objekt hver gang: en Response kan bare leses én gang.
    return Response.json(rute.kropp ?? null, { status: rute.status ?? 200 });
  };

  // Kjører også hvis testen feiler underveis.
  t.after(() => {
    globalThis.fetch = EKTE_FETCH;
  });

  return kall;
}
