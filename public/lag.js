// Min side – her lager du HTML med JavaScript.
//
// Kjør testene:  npm run frontend

/**
 * Oppgave 10
 * Lag én tabellrad av ett objekt fra API-et.
 *
 *   lagRad({ tittel: 'Zelda', plattform: 'Switch', timer: 40 })
 *
 * skal gi det samme som denne HTML-en:
 *
 *   <tr>
 *     <td>Zelda</td>
 *     <td>Switch</td>
 *     <td>40</td>
 *   </tr>
 *
 * Én <td> per verdi, i samme rekkefølge som i objektet.
 * Object.values(rad) gir deg verdiene som en liste.
 *
 * Tre verktøy:
 *   document.createElement('tr')    lager et element
 *   td.textContent = verdi          setter teksten inni
 *   tr.append(td)                   legger et element inni et annet
 *
 * Bruk textContent, ikke innerHTML. Hvorfor? Prøv, og se hva testen sier.
 */
export function lagRad(rad) {
  // TODO
}
