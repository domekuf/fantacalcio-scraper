const axios = require('axios');
const cheerio = require('cheerio');
const csv = require('csv-parser');
const fs = require('fs');

const config = require('./config');
const { program } = require('commander');

// Download HTML and scrape fantasyVote, playedGames and expectedValue
async function getPlayerStats(url) {
  try {
    const response = await axios.get(url);

    const $ = cheerio.load(response.data);

    const fantasyVote = $(config.xpath.fantasyVote)
      .text()
      .trim()
      .replace(',', '.');
    const playedGames = $(config.xpath.playedGames).text().trim();
    const expectedValue = $(config.xpath.expectedValue).text().trim();
    return { url, fantasyVote, playedGames, expectedValue };
  } catch (error) {
    return 'HTTP Error';
  }
}

// Download search page HTML and scrape player's URL
async function getPlayerURL(name) {
  try {
    const url = `https://www.fantacalcio.it/ricerca?q=${encodeURIComponent(
      name,
    )}`;

    const response = await axios.get(url);

    const $ = cheerio.load(response.data);

    // Select element using X Path
    const playerLink = $('a.player-name.player-link').attr('href');

    if (playerLink) {
      return playerLink;
    } else {
      return 'Player not found';
    }
  } catch (error) {
    return 'HTTP Error';
  }
}

function readPlayersFromCSV(csvFileName) {
  const players = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFileName)
      .pipe(csv())
      .on('data', (row) => {
        if (row.name) {
          players.push({
            name: row.name,
            team: row.team,
          });
        }
      })
      .on('end', () => {
        resolve(players);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

program.version('1.0.0');
program
  .option('-u, --url [playerName]', 'Print player URL')
  .option('-s, --stats [playerName]', 'Print player stats')
  .option('-i, --csv-in <csvFileName>', 'Read players from a CSV file')
  .option('-o, --csv-out [separator]', 'Output as CSV');

program.parse(process.argv);

const options = program.opts();

function getPlayerStatsOrUrl(playerName, callback = console.log) {
  getPlayerURL(playerName).then((playerLink) => {
    if (options.stats) {
      getPlayerStats(playerLink).then((playerStats) => {
        callback(playerStats);
      });
    } else {
      callback(playerLink);
    }
  });
}

if (options.csvIn) {
  const s = options.separator || ',';
  readPlayersFromCSV(options.csvIn).then((players) => {
    for (let i in players) {
      const player = players[i];
      getPlayerStatsOrUrl(player.name, (fullPlayer) => {
        if (options.csvOut) {
          console.log(
            `${player.team}${s}${player.name}${s}${fullPlayer.url}${s}${fullPlayer.fantasyVote},${fullPlayer.playedGames}${s}${fullPlayer.expectedValue}`,
          );
        } else {
          console.log(fullPlayer);
        }
      });
    }
  });
} else if (
  typeof options.url === 'string' ||
  typeof options.stats === 'string'
) {
  const playerName = options.url || options.stats;
  getPlayerStatsOrUrl(playerName);
} else {
  console.log('Either --csv-in or player name should be supplied.');
  program.help();
}
