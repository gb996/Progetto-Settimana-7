// SportsHub — Week Project Settimana VII
//
// Devi fare 4 cose per la Versione Base:
// 1. Definire le classi Squadra ed Evento (mappano i dati di TheSportsDB)
// 2. Funzione async cercaSquadre(query) che chiama /searchteams.php
// 3. Funzione async caricaDettagli(idTeam) che chiama in parallelo
//    eventsnext.php + eventslast.php usando Promise.all
// 4. Render dinamico: card squadre, lista prossimi eventi, lista risultati
//
// Endpoint base: https://www.thesportsdb.com/api/v1/json/3/
// Il `3` nell'URL è la chiave API pubblica di test di TheSportsDB: gratis, non serve registrarsi.
//
// Per le versioni Intermedia/Avanzata: localStorage preferiti, debounce, Promise.all multi.


// === Classi ===

// Una squadra: prende l'oggetto "grezzo" dell'API e lo traduce in nomi italiani
class Squadra {
  constructor(dati) {
    this.id = dati.idTeam;
    this.nome = dati.strTeam;
    this.logo = dati.strBadge;
    this.lega = dati.strLeague;
    this.paese = dati.strCountry;
    this.sport = dati.strSport; // servirà per il filtro (Versione Avanzata)
  }
}

// Un evento (partita passata o futura)
class Evento {
  constructor(dati) {
    this.id = dati.idEvent;
    this.data = dati.dateEvent; // es. "2026-07-16"
    this.casa = dati.strHomeTeam;
    this.trasferta = dati.strAwayTeam;
    this.punteggioCasa = dati.intHomeScore; // null se non ancora giocata
    this.punteggioTrasferta = dati.intAwayScore;
  }

  // "2026-07-16" -> "16/07/2026"
  dataFormattata() {
    if (!this.data) return "Data da definire";
    const formatter = new Intl.DateTimeFormat("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    return formatter.format(new Date(this.data));
  }

  // "2 - 1" se c'è il risultato, stringa vuota se la partita non è giocata
  punteggio() {
    if (this.punteggioCasa == null || this.punteggioTrasferta == null) return "";
    return `${this.punteggioCasa} - ${this.punteggioTrasferta}`;
  }
}



// === API ===




// === Stato ===



// === Render ===



// === Eventi ===
