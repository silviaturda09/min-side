// Hjelpefil for testene. Denne fila skal du ikke endre –
// men du har lov (og godt av) å lese den.
//
// Node har ingen nettleser, og dermed ingen «document». Denne fila er en
// liten liksom-versjon med akkurat det lag.js trenger: createElement,
// textContent og append. Testene bruker den til å se hva lagRad bygger.
//
// Den skriver også ned om du bruker innerHTML – for det skal testene
// kunne si fra om.

class LiksomTekst {
  constructor(tekst) {
    this.tekst = tekst;
  }

  get textContent() {
    return this.tekst;
  }
}

export class LiksomElement {
  constructor(tagg) {
    this.tagName = String(tagg).toUpperCase();
    this.children = [];
    this.attributter = {};
    this.dataset = {};
    this.style = {};
    this.className = '';
    this.brukteInnerHTML = false;
  }

  // Bare elementene, ikke tekstbitene – som i en ekte nettleser.
  get elementer() {
    return this.children.filter((b) => b instanceof LiksomElement);
  }

  get textContent() {
    return this.children.map((b) => b.textContent).join('');
  }

  set textContent(verdi) {
    this.children = verdi == null || verdi === '' ? [] : [new LiksomTekst(String(verdi))];
  }

  get innerText() {
    return this.textContent;
  }

  set innerText(verdi) {
    this.textContent = verdi;
  }

  get innerHTML() {
    return this.textContent;
  }

  set innerHTML(verdi) {
    // En ekte nettleser ville tolket teksten som HTML. Vi merker bare av.
    this.brukteInnerHTML = true;
    this.textContent = verdi;
  }

  insertAdjacentHTML(_hvor, html) {
    this.brukteInnerHTML = true;
    this.children.push(new LiksomTekst(String(html)));
  }

  append(...noder) {
    for (const n of noder) {
      this.children.push(n instanceof LiksomElement || n instanceof LiksomTekst ? n : new LiksomTekst(String(n)));
    }
  }

  appendChild(node) {
    this.append(node);
    return node;
  }

  replaceChildren(...noder) {
    this.children = [];
    this.append(...noder);
  }

  setAttribute(navn, verdi) {
    this.attributter[navn.toLowerCase()] = String(verdi);
  }

  getAttribute(navn) {
    return this.attributter[navn.toLowerCase()] ?? null;
  }

  // td.scope = 'row' og td.setAttribute('scope', 'row') skal gi det samme.
  get scope() {
    return this.getAttribute('scope') ?? '';
  }

  set scope(verdi) {
    this.setAttribute('scope', verdi);
  }

  get classList() {
    const el = this;
    return {
      add: (...navn) => {
        el.className = [...el.className.split(' ').filter(Boolean), ...navn].join(' ');
      },
    };
  }

  addEventListener() {}
}

// Gikk innerHTML igjen noe sted i treet?
export function brukteInnerHTML(element) {
  if (!(element instanceof LiksomElement)) return false;
  return element.brukteInnerHTML || element.elementer.some(brukteInnerHTML);
}

export const liksomDocument = {
  createElement: (tagg) => new LiksomElement(tagg),
  createTextNode: (tekst) => new LiksomTekst(String(tekst)),
};
