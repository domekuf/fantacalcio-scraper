
const axios = require('axios');
const cheerio = require('cheerio');

// Funzione per scaricare l'HTML e restituire l'URL del giocatore
//
// Funzione per scaricare l'HTML e restituire i valori FV, PG e QT
async function getPlayerInfo(url) {
  try {
    // Scarica l'HTML della pagina
    const response = await axios.get(url);

    // Carica l'HTML nella libreria cheerio
    const $ = cheerio.load(response.data);


    // Seleziona i valori FV, PG e QT con gli XPath forniti
    const FV = $('#player-main-info div:nth-child(2) div:nth-child(1) ul li:nth-child(2) span:nth-child(1)').text().trim();
    const PG = $('#player-summary-stats > div > header > table > tbody > tr:nth-child(1) > td.value').text().trim();
    const QT = $('#player-main-info div:nth-child(2) div:nth-child(2) ul li:nth-child(1) span:nth-child(1)').text().trim();

    return { FV, PG, QT };

  } catch (error) {
    // Gestisci gli errori, ad esempio se la richiesta HTTP fallisce
    return 'Errore nella richiesta HTTP';
  }
}

async function getPlayerURL(nome) {
  try {
    // Componi l'URL di ricerca
    const url = `https://www.fantacalcio.it/ricerca?q=${encodeURIComponent(nome)}`;

    // Scarica l'HTML della pagina
    const response = await axios.get(url);

    // Carica l'HTML nella libreria cheerio
    const $ = cheerio.load(response.data);

    // Seleziona l'elemento con XPath
    const playerLink = $('a.player-name.player-link').attr('href');

    if (playerLink) {
      // Restituisci l'URL del giocatore
      return getPlayerInfo(playerLink);
    } else {
      // Se l'elemento non è stato trovato, restituisci un messaggio di errore
      return 'Giocatore non trovato';
    }
  } catch (error) {
    // Gestisci gli errori, ad esempio se la richiesta HTTP fallisce
    return 'Errore nella richiesta HTTP';
  }
}

// Esegui la funzione con il nome del giocatore desiderato



const fs = require('fs');
const csv = require('csv-parser');

const csvFileName = 'fante.csv';

// Funzione per leggere i nomi dei giocatori da un file CSV
function readPlayerNamesFromCSV() {
  const playerNames = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFileName)
      .pipe(csv())
      .on('data', (row) => {
        // Assumendo che il nome del giocatore sia nella colonna "nome"
        if (row.nome) {
          playerNames.push(row.nome);
        }
      })
      .on('end', () => {
        resolve(playerNames);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}



async function searchPlayersInCSV() {
    const playerNames = await readPlayerNamesFromCSV(csvFileName);
    for (let playerName of playerNames) {
        getPlayerURL(playerName)
          .then((playerURL) => {
            console.log(playerName + ',' + playerURL.FV.replace(',','.') + ','+ playerURL.PG+','+playerURL.QT);
          })
          .catch((error) => {
            console.error('Errore:', error);
          });
    }

}

searchPlayersInCSV();
