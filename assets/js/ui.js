export const el = {
  formRicerca: document.querySelector("#form-ricerca"),
  inputRicerca: document.querySelector("#input-ricerca"),
  spinner: document.querySelector("#spinner"),
  errore: document.querySelector("#errore"),
  listaPreferite: document.querySelector("#lista-preferite"),
  preferiteVuoto: document.querySelector("#preferite-vuoto"),
  sezioneAppuntamenti: document.querySelector("#sezione-appuntamenti"),
  listaAppuntamenti: document.querySelector("#lista-appuntamenti"),
  filtriSport: document.querySelector("#filtri-sport"),
  listaRisultati: document.querySelector("#lista-risultati"),
  risultatiMessaggio: document.querySelector("#risultati-messaggio"),
  dettagli: document.querySelector("#dettagli"),
  dettagliTitolo: document.querySelector("#dettagli-titolo"),
  listaProssimi: document.querySelector("#lista-prossimi"),
  listaUltimi: document.querySelector("#lista-ultimi"),
  modalEvento: document.querySelector("#modal-evento"),
  modalTitolo: document.querySelector("#modal-evento-titolo"),
  modalDati: document.querySelector("#modal-evento-dati"),
};

export function mostraSpinner() {
  el.spinner.classList.remove("d-none");
}
export function nascondiSpinner() {
  el.spinner.classList.add("d-none");
}
export function mostraErrore(messaggio) {
  el.errore.textContent = messaggio;
  el.errore.classList.remove("d-none");
}
export function nascondiErrore() {
  el.errore.classList.add("d-none");
}

function creaCardSquadra(squadra, tipo, giaPreferita) {
  const col = document.createElement("div");
  col.className = "col-12 col-sm-6 col-lg-4 col-xl-3";

  const card = document.createElement("article");
  card.className = "card h-100 shadow-sm border-0 text-center card-squadra";
  card.dataset.id = squadra.id;

  if (squadra.logo) {
    const img = document.createElement("img");
    img.src = squadra.logo;
    img.alt = `Logo ${squadra.nome}`;
    img.width = 80;
    img.height = 80;
    img.className = "mx-auto mt-3";
    card.append(img);
  }

  const body = document.createElement("div");
  body.className = "card-body";

  const nome = document.createElement("h3");
  nome.className = "h6 fw-bold mb-1";
  nome.textContent = squadra.nome;

  const lega = document.createElement("p");
  lega.className = "small text-secondary mb-0";
  lega.textContent = squadra.lega ?? "";

  const paese = document.createElement("p");
  paese.className = "small text-secondary mb-0";
  paese.textContent = squadra.paese ?? "";

  const bottone = document.createElement("button");
  bottone.type = "button";
  bottone.className = "btn btn-sm w-100 mt-3 fw-semibold";

  if (tipo === "preferita") {
    bottone.textContent = "🗑 Rimuovi";
    bottone.classList.add("btn-outline-danger");
    bottone.dataset.azione = "rimuovi";
  } else if (giaPreferita) {
    bottone.textContent = "✓ Già nei preferiti";
    bottone.classList.add("btn-secondary");
    bottone.disabled = true;
  } else {
    bottone.textContent = "★ Aggiungi ai preferiti";
    bottone.classList.add("btn-warning");
    bottone.dataset.azione = "aggiungi";
  }

  body.append(nome, lega, paese, bottone);
  card.append(body);
  col.append(card);
  return col;
}

export function renderRisultati(squadre, filtroSport, isPreferita) {
  const visibili =
    filtroSport === "tutti" ? squadre : squadre.filter((s) => s.sport === filtroSport);

  el.listaRisultati.replaceChildren(
    ...visibili.map((s) => creaCardSquadra(s, "risultato", isPreferita(s.id)))
  );

  if (squadre.length === 0) {
    el.risultatiMessaggio.textContent = "Nessuna squadra trovata.";
    el.risultatiMessaggio.classList.remove("d-none");
  } else if (visibili.length === 0) {
    el.risultatiMessaggio.textContent = "Nessuna squadra di questo sport tra i risultati.";
    el.risultatiMessaggio.classList.remove("d-none");
  } else {
    el.risultatiMessaggio.classList.add("d-none");
  }
}

export function renderPreferite(preferite) {
  el.listaPreferite.replaceChildren(...preferite.map((s) => creaCardSquadra(s, "preferita")));
  el.preferiteVuoto.classList.toggle("d-none", preferite.length > 0);
}

export function aggiornaFiltroAttivo(filtroSport) {
  el.filtriSport.querySelectorAll("[data-sport]").forEach((btn) => {
    const attivo = btn.dataset.sport === filtroSport;
    btn.classList.toggle("active", attivo);
    btn.setAttribute("aria-pressed", attivo);
  });
}

function creaRigaEvento(evento) {
  const li = document.createElement("li");
  li.className = "py-2 border-bottom riga-evento";
  li.dataset.id = evento.id;
  li.tabIndex = 0;
  li.setAttribute("role", "button");

  const data = document.createElement("div");
  data.className = "small text-secondary";
  data.textContent = evento.dataFormattata();

  const partita = document.createElement("div");
  partita.className = "fw-semibold";
  partita.textContent = `${evento.casa} vs ${evento.trasferta}`;

  if (evento.punteggio()) {
    const badge = document.createElement("span");
    badge.className = "badge text-bg-success ms-2";
    badge.textContent = evento.punteggio();
    partita.append(badge);
  }

  li.append(data, partita);
  return li;
}

function renderListaEventi(ul, eventi, messaggioVuoto) {
  if (eventi.length === 0) {
    const li = document.createElement("li");
    li.className = "small fst-italic text-secondary py-2";
    li.textContent = messaggioVuoto;
    ul.replaceChildren(li);
    return;
  }
  ul.replaceChildren(...eventi.map(creaRigaEvento));
}

export function renderDettagli(squadra, eventi) {
  el.dettagliTitolo.textContent = squadra.nome;
  renderListaEventi(el.listaProssimi, eventi.prossimi, "Nessun evento in programma");
  renderListaEventi(el.listaUltimi, eventi.ultimi, "Nessun risultato disponibile");
  el.dettagli.classList.remove("d-none");
  el.dettagli.scrollIntoView({ behavior: "smooth" });
}

export function mostraSezioneAppuntamenti(visibile) {
  el.sezioneAppuntamenti.classList.toggle("d-none", !visibile);
}

export function renderAppuntamenti(eventi) {
  renderListaEventi(
    el.listaAppuntamenti,
    eventi,
    "Nessun appuntamento in programma per le tue squadre"
  );
}

export function apriModalEvento(evento) {
  el.modalTitolo.textContent = `${evento.casa} vs ${evento.trasferta}`;

  const righe = [
    ["Data", evento.dataFormattata()],
    ["Ora", evento.oraFormattata()],
    ["Risultato", evento.punteggio() || "Da giocare"],
    ["Competizione", evento.competizione],
    ["Stagione", evento.stagione],
    ["Giornata", evento.giornata],
    ["Stadio", evento.stadio],
  ];

  const elementi = [];
  righe
    .filter(([, valore]) => valore)
    .forEach(([etichetta, valore]) => {
      const dt = document.createElement("dt");
      dt.className = "col-5 text-secondary fw-normal";
      dt.textContent = etichetta;

      const dd = document.createElement("dd");
      dd.className = "col-7 fw-semibold";
      dd.textContent = valore;

      elementi.push(dt, dd);
    });
  el.modalDati.replaceChildren(...elementi);

  bootstrap.Modal.getOrCreateInstance(el.modalEvento).show();
}
