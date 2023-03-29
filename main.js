const user_id = "325851667310313472";
const baseURL = "https://api.sleeper.app/v1/";
const tradeDataElement = document.getElementById("tradeData");
const leagueSelectElement = document.getElementById("leagueSelect");
const statusMessageElement = document.getElementById("statusMessage");
const yearSelectElement = document.getElementById("yearSelect");

let tradesCache = JSON.parse(localStorage.getItem("tradesCache")) || {};
let rostersCache = JSON.parse(localStorage.getItem("rostersCache")) || {};

async function getLeagues(userId) {
  const leagues = [];
  for (let year = 2017; year <= new Date().getFullYear(); year++) {
    const response = await fetch(baseURL + "user/" + userId + "/leagues/nfl/" + year);
    const yearlyLeagues = await response.json();
    leagues.push(...yearlyLeagues);
  }
  return leagues;
}

async function getTransactionsForLeague(leagueId) {
  const transactions = [];
  const maxWeeks = 18;

  for (let week = 1; week <= maxWeeks; week++) {
    const response = await fetch(baseURL + "league/" + leagueId + "/transactions/" + week);
    const weeklyTransactions = await response.json();
    const trades = weeklyTransactions.filter((transaction) => transaction.type === "trade");
    transactions.push(...trades);
  }

  return transactions;
}

function displayTradeInfo(playerTradeInfo, trade) {
  const tradeInfoElement = document.createElement("div");
  tradeInfoElement.classList.add("trade");

  const fromTeamElement = document.createElement("p");
  fromTeamElement.textContent = `From: ${trade.metadata.from_team_name}`;
  tradeInfoElement.appendChild(fromTeamElement);

  const toTeamElement = document.createElement("p");
  toTeamElement.textContent = `To: ${trade.metadata.to_team_name}`;
  tradeInfoElement.appendChild(toTeamElement);

  const playerContainer = document.createElement("div");
  playerContainer.classList.add("player-container");

  for (const playerInfo of playerTradeInfo) {
    const playerElement = document.createElement("div");
    playerElement.classList.add("player");
    const playerImageUrl = getPlayerImageUrl(playerInfo);
    playerElement.style.backgroundImage = `url(${playerImageUrl})`;
    playerElement.style.backgroundSize = "cover";

    const playerTextElement = document.createElement("p");
    playerTextElement.textContent = `${playerInfo.playerName} (${playerInfo.position})`;
    playerElement.appendChild(playerTextElement);

    playerContainer.appendChild(playerElement);
  }

  tradeInfoElement.appendChild(playerContainer);
  tradeDataElement.appendChild(tradeInfoElement);
}

function getPlayerImageUrl(playerInfo) {
    if (playerInfo.position === "DEF") {
        return `https://sleepercdn.com/images/team_logos/nfl/${playerInfo.team.toLowerCase()}.png`;
    }
    return `https://sleepercdn.com/content/nfl/players/thumb/${playerInfo.player_id}.jpg`;
}

async function getLeagueRosters(leagueId) {
  let rosters = rostersCache[leagueId];
  if (!rosters) {
  const storedRosters = localStorage.getItem(rosters_${leagueId});
  if (storedRosters) {
  rosters = JSON.parse(storedRosters);
  } else {
  const rosterResponse = await fetch(baseURL + "league/" + leagueId + "/rosters");
  rosters = await rosterResponse.json();
  localStorage.setItem(rosters_${leagueId}, JSON.stringify(rosters));
  }
  rostersCache[leagueId] = rosters;
  localStorage.setItem(rostersCache, JSON.stringify(rostersCache));
  }
  return rosters;
  }
  
  async function main() {
  const storageKey = "trades";
  let leagues = JSON.parse(localStorage.getItem("leagues"));
  if (!leagues) {
    leagues = await getLeagues(user_id);
    localStorage.setItem("leagues", JSON.stringify(leagues));
}

const uniqueLeagueNames = Array.from(new Set(leagues.map((league) => league.name)));

for (const leagueName of uniqueLeagueNames) {
    const option = document.createElement("option");
    option.value = leagueName;
    option.text = leagueName;
    leagueSelectElement.add(option);
}

let trades = JSON.parse(localStorage.getItem(storageKey));

if (!trades) {
    displayStatusMessage("Loading trade data...");

    trades = {};
    for (const league of leagues) {
    const leagueTrades = await getTransactionsForLeague(league.league_id);
    trades[league.league_id] = leagueTrades;
    }

    localStorage.setItem(storageKey, JSON.stringify(trades));

    displayStatusMessage("");
} else {
    tradesCache = trades;
}

let rosters = JSON.parse(localStorage.getItem('rosters'));

if (!rosters) {
    displayStatusMessage("Loading roster data...");

    rosters = {};
    for (const league of leagues) {
    const leagueRosters = await getLeagueRosters(league.league_id);
    rosters[league.league_id] = leagueRosters;
    }

    localStorage.setItem('rosters', JSON.stringify(rosters));

    displayStatusMessage("");
} else {
    rostersCache = rosters;
}

// When a new league is selected from the dropdown
leagueSelectElement.addEventListener("change", async (event) => {
    const selectedLeagueName = event.target.value;
    const latestYear = getUniqueYears(leagues, selectedLeagueName)[0];
    statusMessage.textContent = "Loading trades...";
    await displayTradesForYear(leagues, selectedLeagueName, latestYear);
    statusMessage.textContent = "";
});

// When a new year is selected from the year dropdown
yearSelectElement.addEventListener("change", async (event) => {
    const selectedYear = event.target.value;
    const selectedLeagueName = leagueSelectElement.value;
    statusMessage.textContent = "Loading trades...";
    await displayTradesForYear(leagues, selectedLeagueName, selectedYear);
    statusMessage.textContent = "";
});
const initialLeagueName = uniqueLeagueNames[0];
await displayTradesForSelectedLeague(leagues, initialLeagueName);
}

main();