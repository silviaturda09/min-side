// Min side – her skriver du koden som snakker med serveren din.
//
// Kjør testene:  npm run frontend
//
// Bytt ut TABELL med navnet på tabellen din, for eksempel /api/spill.
// Bruk adressen uten http://localhost:3000 foran – da virker sida uansett
// hvilken port den kjører på, og på maskinen til den som kloner repoet ditt.

/**
 * Oppgave 9
 * Hent alle radene fra API-et ditt.
 *
 *   await hentAlle()  ->  [{ tittel: 'Zelda', timer: 40, ... }, ...]
 *
 * VIKTIG: fetch kaster IKKE av seg selv når serveren svarer 404 eller 500.
 * Du får bare et svar der svar.ok er false. Sjekk det, og kast en feil
 * med en forklaring på norsk:
 *
 *   throw new Error('...');
 *
 * Sender serveren { feil: '...' }, er det fint å bruke den teksten.
 */
export async function hentAlle() {
  const svar = await fetch('/api/film');

  if (!svar.ok) {
    const feil = await svar.json();
    throw new Error(feil.feil || 'Kunne ikke hente filmer');
  }

  return await svar.json();
}  // TODO


/**
 * Oppgave 14
 * Send én ny rad til API-et ditt, og gi tilbake det serveren svarer.
 *
 *   await leggTil({ tittel: 'Tetris', timer: '3' })  ->  { id: 6, tittel: 'Tetris', timer: 3 }
 *
 * En POST trenger tre ting mer enn en GET:
 *   - method: 'POST'
 *   - headers: { 'Content-Type': 'application/json' }
 *   - body: JSON.stringify(rad)
 *
 * Sjekk svar.ok her også.
 */
export async function leggTil(rad) {
  const svar = await fetch('/api/film', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(rad)
  });

  if (!svar.ok) {
    const feil = await svar.json();
    throw new Error(feil.feil || 'Kunne ikke legge til film');
  }

  return await svar.json();
}  // TODO

