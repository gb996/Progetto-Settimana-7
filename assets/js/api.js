export class Squadra {
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

export class Evento {
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

export async function cercaSquadre(query, signal) {
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

export async function caricaDettagli(idTeam) {
  const [datiProssimi, datiUltimi] = await Promise.all([
    caricaEventi("eventsnext.php", idTeam),
    caricaEventi("eventslast.php", idTeam),
  ]);

  return {

    prossimi: (datiProssimi.events ?? []).map((e) => new Evento(e)),
    ultimi: (datiUltimi.results ?? []).map((e) => new Evento(e)),
  };
}

export async function caricaAppuntamenti(squadre) {
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
