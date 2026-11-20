import { Squadra, cercaSquadre, caricaDettagli, caricaAppuntamenti } from "./api.js";
import {
  el,
  mostraSpinner,
  nascondiSpinner,
  mostraErrore,
  nascondiErrore,
  renderRisultati,
  renderPreferite,
  aggiornaFiltroAttivo,
  renderDettagli,
  mostraSezioneAppuntamenti,
  renderAppuntamenti,
  apriModalEvento,
} from "./ui.js";

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
