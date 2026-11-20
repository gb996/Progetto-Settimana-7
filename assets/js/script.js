class Squadra {
  constructor(dati) {
    this.id = dati.idTeam;
    this.nome = dati.strTeam;
    this.logo = dati.strBadge;
    this.lega = dati.strLeague;
    this.paese = dati.strCountry;
    this.sport = dati.strSport;
  }

  static fromJSON(dati) {
    return Object.assign(new Squadra({}), dati);
  }
}

class Evento {
  constructor(dati) {
    this.id = dati.idEvent;
    this.data = dati.dateEvent;
    this.casa = dati.strHomeTeam;
    this.trasferta = dati.strAwayTeam;
    this.punteggioCasa = dati.intHomeScore;
    this.punteggioTrasferta = dati.intAwayScore;

    this.ora = dati.strTime;
    this.competizione = dati.strLeague;
    this.stagione = dati.strSeason;
    this.giornata = dati.intRound;
    this.stadio = dati.strVenue;
  }

  dataFormattata() {
    if (!this.data) return "Data da definire";
    const formatter = new Intl.DateTimeFormat("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    return formatter.format(new Date(this.data));
  }

  oraFormattata() {
    return this.ora ? this.ora.slice(0, 5) : "";
  }

  punteggio() {
    if (this.punteggioCasa == null || this.punteggioTrasferta == null) return "";
    return `${this.punteggioCasa} - ${this.punteggioTrasferta}`;
  }
}

const API_BASE = "https://www.thesportsdb.com/api/v1/json/123/";

async function cercaSquadre(query, signal) {
  const url = new URL("searchteams.php", API_BASE);
  url.searchParams.set("t", query);

  const risposta = await fetch(url, { signal });
  if (!risposta.ok) throw new Error(`HTTP ${risposta.status}`);

  const dati = await risposta.json();

  return (dati.teams ?? []).map((t) => new Squadra(t));
}

async function caricaEventi(endpoint, idTeam) {
  const url = new URL(endpoint, API_BASE);
  url.searchParams.set("id", idTeam);

  const risposta = await fetch(url);
  if (!risposta.ok) throw new Error(`HTTP ${risposta.status}`);
  return risposta.json();
}

async function caricaDettagli(idTeam) {
  const [datiProssimi, datiUltimi] = await Promise.all([
    caricaEventi("eventsnext.php", idTeam),
    caricaEventi("eventslast.php", idTeam),
  ]);

  return {

    prossimi: (datiProssimi.events ?? []).map((e) => new Evento(e)),
    ultimi: (datiUltimi.results ?? []).map((e) => new Evento(e)),
  };
}

async function caricaAppuntamenti(squadre) {
  const esiti = await Promise.allSettled(
    squadre.map((s) => caricaEventi("eventsnext.php", s.id))
  );

  const eventi = [];
  esiti.forEach((esito, i) => {
    if (esito.status === "fulfilled") {
      (esito.value.events ?? []).forEach((e) => eventi.push(new Evento(e)));
    } else {
      console.warn(`Appuntamenti non caricati per ${squadre[i].nome}:`, esito.reason);
    }
  });

  const unici = eventi.filter((ev, i) => eventi.findIndex((x) => x.id === ev.id) === i);

  return unici.sort((a, b) => (a.data ?? "").localeCompare(b.data ?? ""));
}

const el = {
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

function mostraSpinner() {
  el.spinner.classList.remove("d-none");
}
function nascondiSpinner() {
  el.spinner.classList.add("d-none");
}
function mostraErrore(messaggio) {
  el.errore.textContent = messaggio;
  el.errore.classList.remove("d-none");
}
function nascondiErrore() {
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

function renderRisultati(squadre, filtroSport, isPreferita) {
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

function renderPreferite(preferite) {
  el.listaPreferite.replaceChildren(...preferite.map((s) => creaCardSquadra(s, "preferita")));
  el.preferiteVuoto.classList.toggle("d-none", preferite.length > 0);
}

function aggiornaFiltroAttivo(filtroSport) {
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

function renderDettagli(squadra, eventi) {
  el.dettagliTitolo.textContent = squadra.nome;
  renderListaEventi(el.listaProssimi, eventi.prossimi, "Nessun evento in programma");
  renderListaEventi(el.listaUltimi, eventi.ultimi, "Nessun risultato disponibile");
  el.dettagli.classList.remove("d-none");
  el.dettagli.scrollIntoView({ behavior: "smooth" });
}

function mostraSezioneAppuntamenti(visibile) {
  el.sezioneAppuntamenti.classList.toggle("d-none", !visibile);
}

function renderAppuntamenti(eventi) {
  renderListaEventi(
    el.listaAppuntamenti,
    eventi,
    "Nessun appuntamento in programma per le tue squadre"
  );
}

function apriModalEvento(evento) {
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

let squadreTrovate = [];
let filtroSport = "tutti";
const eventiPerId = {};

const CHIAVE_PREFERITE = "sportshub.preferite";

function caricaPreferite() {
  const dati = JSON.parse(localStorage.getItem(CHIAVE_PREFERITE) ?? "[]");
  return dati.map((d) => Squadra.fromJSON(d));
}

function salvaPreferite() {
  localStorage.setItem(CHIAVE_PREFERITE, JSON.stringify(preferite));
}

function isPreferita(id) {
  return preferite.some((s) => s.id === id);
}

let preferite = caricaPreferite();

function registraEventi(eventi) {
  eventi.forEach((ev) => (eventiPerId[ev.id] = ev));
}

function aggiornaRisultati() {
  renderRisultati(squadreTrovate, filtroSport, isPreferita);
}

let controllerRicerca;
let timeoutRicerca;

async function eseguiRicerca(query) {
  controllerRicerca?.abort();
  const controller = new AbortController();
  controllerRicerca = controller;

  nascondiErrore();
  mostraSpinner();
  try {
    squadreTrovate = await cercaSquadre(query, controller.signal);
    aggiornaRisultati();
  } catch (err) {
    if (err.name === "AbortError") return;
    mostraErrore(`Errore nella ricerca: ${err.message}`);
  } finally {

    if (controller === controllerRicerca) nascondiSpinner();
  }
}

el.inputRicerca.addEventListener("input", () => {
  clearTimeout(timeoutRicerca);
  const query = el.inputRicerca.value.trim();
  if (query.length < 3) return;
  timeoutRicerca = setTimeout(() => eseguiRicerca(query), 400);
});

el.formRicerca.addEventListener("submit", (e) => {
  e.preventDefault();
  clearTimeout(timeoutRicerca);
  const query = el.inputRicerca.value.trim();
  if (query) eseguiRicerca(query);
});

el.filtriSport.addEventListener("click", (e) => {
  const bottone = e.target.closest("[data-sport]");
  if (!bottone) return;

  filtroSport = bottone.dataset.sport;
  aggiornaFiltroAttivo(filtroSport);
  if (squadreTrovate.length > 0) aggiornaRisultati();
});

async function mostraDettagliSquadra(squadra) {
  nascondiErrore();
  mostraSpinner();
  try {
    const eventi = await caricaDettagli(squadra.id);
    registraEventi([...eventi.prossimi, ...eventi.ultimi]);
    renderDettagli(squadra, eventi);
  } catch (err) {
    mostraErrore(`Errore nel caricamento dei dettagli: ${err.message}`);
  } finally {
    nascondiSpinner();
  }
}

el.listaRisultati.addEventListener("click", (e) => {
  const card = e.target.closest(".card-squadra");
  if (!card) return;

  const squadra = squadreTrovate.find((s) => s.id === card.dataset.id);
  if (!squadra) return;

  if (e.target.closest('[data-azione="aggiungi"]')) {
    aggiungiPreferita(squadra);
  } else {
    mostraDettagliSquadra(squadra);
  }
});

el.listaPreferite.addEventListener("click", (e) => {
  const card = e.target.closest(".card-squadra");
  if (!card) return;

  const squadra = preferite.find((s) => s.id === card.dataset.id);
  if (!squadra) return;

  if (e.target.closest('[data-azione="rimuovi"]')) {
    rimuoviPreferita(squadra.id);
  } else {
    mostraDettagliSquadra(squadra);
  }
});

function aggiungiPreferita(squadra) {
  if (isPreferita(squadra.id)) return;
  preferite.push(squadra);
  aggiornaDopoPreferite();
}

function rimuoviPreferita(id) {
  preferite = preferite.filter((s) => s.id !== id);
  aggiornaDopoPreferite();
}

function aggiornaDopoPreferite() {
  salvaPreferite();
  renderPreferite(preferite);
  if (squadreTrovate.length > 0) aggiornaRisultati();
  aggiornaAppuntamenti();
}

async function aggiornaAppuntamenti() {
  mostraSezioneAppuntamenti(preferite.length > 0);
  if (preferite.length === 0) return;

  const eventi = await caricaAppuntamenti(preferite);
  registraEventi(eventi);
  renderAppuntamenti(eventi);
}

function gestisciAperturaEvento(e) {
  if (e.type === "keydown" && e.key !== "Enter") return;

  const riga = e.target.closest(".riga-evento");
  if (!riga) return;

  const evento = eventiPerId[riga.dataset.id];
  if (evento) apriModalEvento(evento);
}

[el.dettagli, el.listaAppuntamenti].forEach((contenitore) => {
  contenitore.addEventListener("click", gestisciAperturaEvento);
  contenitore.addEventListener("keydown", gestisciAperturaEvento);
});

renderPreferite(preferite);
aggiornaAppuntamenti();
