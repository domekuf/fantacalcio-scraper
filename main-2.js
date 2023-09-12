
const axios = require('axios');
const cheerio = require('cheerio');

// Funzione per scaricare l'HTML e restituire i valori FV, PG e QT
async function getPlayerInfo(nome) {
  try {
    // Componi l'URL di ricerca
    const url = `https://www.fantacalcio.it/ricerca?q=${encodeURIComponent(nome)}`;

    // Scarica l'HTML della pagina
    const response = await axios.get(url);

    // Carica l'HTML nella libreria cheerio
    const $ = cheerio.load(response.data);


    // Seleziona i valori FV, PG e QT con gli XPath forniti
    console.log($('#player-main-info').text());
    const FV = $('#player-main-info div:nth-child(2) div:nth-child(1) ul li:nth-child(2) span:nth-child(1)').text().trim();
    const PG = $('#player-summary-stats header table tbody tr:nth-child(1) td:nth-child(1)').text().trim();
    const QT = $('#player-main-info div:nth-child(2) div:nth-child(2) ul li:nth-child(1) span:nth-child(1)').text().trim();

    return { FV, PG, QT };

  } catch (error) {
    // Gestisci gli errori, ad esempio se la richiesta HTTP fallisce
    return 'Errore nella richiesta HTTP';
  }
}

// Ottieni il playerName dalla command line
const playerName = process.argv[2];
console.log(playerName);

if (!playerName) {
  console.error('Inserire il nome del giocatore come argomento.');
  process.exit(1);
}

// Esegui la funzione con il playerName fornito
getPlayerInfo(playerName)
  .then((playerInfo) => {
    if (typeof playerInfo === 'object') {
      console.log('FV:', playerInfo.FV);
      console.log('PG:', playerInfo.PG);
      console.log('QT:', playerInfo.QT);
    } else {
      console.error('Errore:', playerInfo);
    }
  })
  .catch((error) => {
    console.error('Errore:', error);
  });

