const user_id = "325851667310313472";
const baseURL = "https://api.sleeper.app/v1/";
const tradeDataElement = document.getElementById("tradeData");
const leagueSelectElement = document.getElementById("leagueSelect");
const yearSelectElement = document.getElementById("yearSelect");
const usernameInputElement = document.getElementById("usernameInput");
const submitUsernameButtonElement = document.getElementById("submitUsernameButton");
const statusMessageElement = document.getElementById("statusMessage");
const leagueYearSelectContainerElement = document.getElementById("leagueYearSelectContainer");
const searchButton = document.getElementById("searchButton");

async function getUserIdFromUsername(username) {
  const response = await fetch(`${baseURL}user/${username}`);
  const data = await response.json();
  if (!data) {
    throw new Error("Invalid username.");
  }
  return data.user_id;
}

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
  console.log(leagueId);
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
function displayTradeInfo(playerTradeInfo) {
  const tradeElement = document.createElement("div");
  tradeElement.classList.add("trade");

  const tradeTable = document.createElement("table");
  tradeElement.appendChild(tradeTable);

  const tradeTimestamp = document.createElement("span");
  tradeTimestamp.classList.add("trade-timestamp");
  tradeElement.appendChild(tradeTimestamp);

  const tradeHead = document.createElement("thead");
  tradeTable.appendChild(tradeHead);

  const tradeHeadRow = document.createElement("tr");
  tradeHead.appendChild(tradeHeadRow);

  const tradeHeadCellLeft = document.createElement("th");
  tradeHeadRow.appendChild(tradeHeadCellLeft);

  const tradeSpanLeft = document.createElement("span");
  tradeSpanLeft.classList.add("left-trade-header");
  tradeHeadCellLeft.appendChild(tradeSpanLeft);

  const tradeHeadCellRight = document.createElement("th");
  tradeHeadRow.appendChild(tradeHeadCellRight);

  const tradeSpanRight = document.createElement("span");
  tradeSpanRight.classList.add("right-trade-header");
  tradeHeadCellRight.appendChild(tradeSpanRight);

  const tradeTableBody = document.createElement("tbody");
  tradeTable.appendChild(tradeTableBody);
  playerTradeInfo.forEach((player) => {
    const tradeTableRow = document.createElement("tr");
    tradeTableBody.appendChild(tradeTableRow);

    const tradeTableCellLeft = document.createElement("td");
    tradeTableRow.appendChild(tradeTableCellLeft);

    const tradeTableCellRight = document.createElement("td");
    tradeTableRow.appendChild(tradeTableCellRight);

    const playerCell = document.createElement("div");
    playerCell.classList.add("player-cell");

    const playerSlot = document.createElement("div");
    playerSlot.classList.add("player-slot");
    playerCell.appendChild(playerSlot);

    const tradeSlot = document.createElement("div");
    tradeSlot.classList.add("trade-slot");
    tradeSlot.style.backgroundImage = `url(${player.playerImage})`;
    playerSlot.appendChild(tradeSlot);

    const tradeIndicator = document.createElement("i");
    tradeIndicator.classList.add("material-symbols-outlined", "trade-indicator");
    tradeIndicator.innerHTML = "add_circle";
    tradeSlot.appendChild(tradeIndicator);

    const playerPositionTeam = document.createElement("div");
    playerPositionTeam.classList.add("player-position-team");
    playerPositionTeam.textContent = player.teamName ? `${player.playerName} - ${player.playerPosition}` : player.playerName;
    playerSlot.appendChild(playerPositionTeam);
    if(player.newOwnerRosterId < player.originalOwnerRosterId) {
      tradeTableCellLeft.appendChild(playerCell);
    }
    else {
      tradeTableCellRight.appendChild(playerCell);
    }
    tradeSpanRight.textContent = player.originalOwnerDisplayName;
    tradeSpanLeft.textContent = player.newOwnerDisplayName;
    tradeTimestamp.textContent = player.timestamp;
  });

  tradeDataElement.appendChild(tradeElement);
}



async function getLeagueTrades(leagueId) {
  const storedTrades = localStorage.getItem(`trades_${leagueId}`);
  if (storedTrades) {
    return JSON.parse(storedTrades);
  }

  const leagueTrades = await getTransactionsForLeague(leagueId);
  localStorage.setItem(`trades_${leagueId}`, JSON.stringify(leagueTrades));
  return leagueTrades;
}

async function getLeagueRosters(leagueId) {
  let rosters = JSON.parse(localStorage.getItem(`rosters_${leagueId}`));
  if (!rosters) {
    const rosterResponse = await fetch(`${baseURL}league/${leagueId}/rosters`);
    rosters = await rosterResponse.json();
    localStorage.setItem(`rosters_${leagueId}`, JSON.stringify(rosters));
  }
  return rosters;
}
  
function getUniqueYears(leagues, selectedLeagueName) {
  const selectedLeagues = leagues.filter((league) => league.name === selectedLeagueName);
  const uniqueYears = [...new Set(selectedLeagues.map((league) => league.season))];
  uniqueYears.sort((a, b) => b - a);
  return uniqueYears;
}

function populateLeagueDropdown(leagues) {
  // Create an array to store unique league names
  const uniqueLeagueNames = [];

  // Clear the leagueSelectElement
  leagueSelectElement.innerHTML = "";

  // Loop through the leagues and add unique names to the array and options to the select element
  for (const league of leagues) {
    if (!uniqueLeagueNames.includes(league.name)) {
      uniqueLeagueNames.push(league.name);

      const option = document.createElement("option");
      option.value = league.name;
      option.text = league.name;
      leagueSelectElement.add(option);
    }
  }
}


function populateYearDropdown(uniqueYears) {
  if (uniqueYears.length > 1) {
    yearSelectElement.innerHTML = uniqueYears.map(year => `<option value="${year}">${year}</option>`).join("");
    yearSelectElement.disabled = false;
  } else {
    yearSelectElement.innerHTML = "";
    yearSelectElement.disabled = true;
  }
}

async function displayTradesForSelectedLeague(leagues, selectedLeagueName) {
  tradeDataElement.innerHTML = "";
  const selectedLeagues = leagues.filter((league) => league.name === selectedLeagueName);
  const uniqueYears = getUniqueYears(leagues, selectedLeagueName);
  const yearOptionsHTML = uniqueYears
  .map((year) => `<option value="${year}">${year}</option>`)
  .join("");
  yearSelectElement.innerHTML = yearOptionsHTML;

  await displayTradesForYear(selectedLeagues, selectedLeagueName, uniqueYears[0]);
}

async function displayTradesForYear(leagues, selectedLeagueName, year) {
  tradeDataElement.innerHTML = "";

  const selectedLeagues = leagues.filter((league) => league.name === selectedLeagueName);
  const leaguesForYear = selectedLeagues.filter((league) => league.season === year);

  for (const league of leaguesForYear) {
    await processLeagueTrades(league);
  }
}

async function getLeagueTradesUsers(leagueId) {
  let leagueUsers = JSON.parse(localStorage.getItem(`leagueUsers_${leagueId}`));
  if (!leagueUsers) {
    const response = await fetch(`${baseURL}league/${leagueId}/rosters`);
    const rosters = await response.json();
    const userIds = [...new Set(rosters.map((roster) => roster.owner_id))];
    const usersResponse = await fetch(`${baseURL}league/${leagueId}/users`);
    const users = await usersResponse.json();
    leagueUsers = userIds.map((userId) => {
      const roster = rosters.find((roster) => roster.owner_id === userId);
      const user = users.find((user) => user.user_id === userId);
      return {
        user_id: userId,
        roster_id: roster.roster_id,
        display_name: user.display_name,
      };
    });
    localStorage.setItem(`leagueUsers_${leagueId}`, JSON.stringify(leagueUsers));
  }
  return leagueUsers;
}
  
  
  

async function processLeagueTrades(league) {
  const leagueTrades = await getLeagueTrades(league.league_id);
  const leagueUsers = await getLeagueTradesUsers(league.league_id);
  const yearHeader = document.createElement("h2");
  yearHeader.textContent = league.season;
  tradeDataElement.appendChild(yearHeader);
  if (leagueTrades) {
    for (const trade of leagueTrades) {
      if (trade.adds && typeof trade.adds === "object") {
        const playerTradeInfo = Object.entries(trade.adds).map(([playerId]) => {
          const playerObj = players[playerId];
          let playerName = playerObj ? playerObj.full_name : "Unknown Player";
          let playerImage = playerObj ? `https://sleepercdn.com/content/nfl/players/thumb/${playerId}.jpg` : "";
          const teamName = playerObj ? playerObj.team || "" : "";
          const playerPosition = playerObj ? playerObj.position || "" : "";
          const teamLogo = teamName ? `https://sleepercdn.com/images/team_logos/nfl/${teamName.toLowerCase()}.png` : "";
          if (playerPosition === "DEF") {
            playerImage = teamLogo;
            playerName = playerObj.first_name + ' ' + playerObj.last_name;
          }
          const timestamp = digestDate(trade.status_updated);
          const originalOwnerRosterId = trade.drops[playerId];
          const newOwnerRosterId = trade.adds[playerId];
          const originalOwner = leagueUsers.find(user => user.roster_id === originalOwnerRosterId);
          const newOwner = leagueUsers.find(user => user.roster_id === newOwnerRosterId);
          const originalOwnerDisplayName = originalOwner ? originalOwner.display_name : "";
          const newOwnerDisplayName = newOwner ? newOwner.display_name : "";

          return {
            playerName,
            playerPosition,
            playerImage: playerImage,
            teamName: teamName,
            timestamp: timestamp,
            originalOwnerDisplayName: originalOwnerDisplayName,
            newOwnerDisplayName: newOwnerDisplayName,
            originalOwnerRosterId: originalOwnerRosterId,
            newOwnerRosterId: newOwnerRosterId

          };
        });
        if(trade.draft_picks) {
          // console.log(trade.draft_picks);
          for (const draftPick of trade.draft_picks) {
            timestamp = digestDate(trade.status_updated);
            originalOwnerRosterId = draftPick.previous_owner_id;
            newOwnerRosterId = draftPick.owner_id;
            originalOwner = leagueUsers.find(user => user.roster_id === originalOwnerRosterId);
            newOwner = leagueUsers.find(user => user.roster_id === newOwnerRosterId);
            originalOwnerDisplayName = originalOwner ? originalOwner.display_name : "";
            newOwnerDisplayName = newOwner ? newOwner.display_name : "";
            playerImage = `https://sleepercdn.com/images/v2/icons/player_default.webp`;
            playerPosition = draftPick.season;
            teamName = "N/A";
            // console.log(playerPosition)
            function getNumEnd(num) {
              switch (num) {
                  case 1:
                      return "st";
                  case 2:
                      return "nd";
                  case 3:
                      return "rd";
                  default:
                      return "th";
              }
          }
            playerName = draftPick.round + getNumEnd(draftPick.round) + " round pick";
            const newDraftPicks= {
              timestamp: timestamp,
              originalOwnerDisplayName: originalOwnerDisplayName,
              newOwnerDisplayName: newOwnerDisplayName,
              originalOwnerRosterId: originalOwnerRosterId,
              newOwnerRosterId: newOwnerRosterId,
              playerImage: playerImage,
              playerName,
              playerPosition,
              teamName
            }
            playerTradeInfo.push(newDraftPicks);
            // console.log(playerTradeInfo); 
          }

        }
        displayTradeInfo(playerTradeInfo);
      }
    }
  }
}

async function getUserDrafts(userId) {
  const drafts = [];
  for (let year = 2017; year <= new Date().getFullYear(); year++) {
    const response = await fetch(`${baseURL}user/${userId}/drafts/nfl/${year}`);
    const yearlyDrafts = await response.json();
    drafts.push(...yearlyDrafts);
  }
  return drafts;
}

async function getDraftPicks(draftArray) {
  const picks = [];
  for (const draft of draftArray) {
    const response = await fetch(`${baseURL}draft/${draft.draft_id}/picks`);
    const allDraftPicks = await response.json();
    if (Array.isArray(allDraftPicks)) {
      picks.push(...allDraftPicks);
    }
  }
  return picks;
}

async function getTradedPicks(draftArray) {
  const tradedPicks = [];
  for (const draft of draftArray) {
    const response = await fetch(`${baseURL}draft/${draft.draft_id}/traded_picks`);
    const allTradedPicks = await response.json();
    if (Array.isArray(allTradedPicks)) {
      tradedPicks.push(...allTradedPicks);
    }
  }
  return tradedPicks;
}

async function processUserDrafts(userId) {
  const drafts = await getUserDrafts(userId);
  const draftPicks = await getDraftPicks(drafts);
  const tradedPicks = await getTradedPicks(drafts);
  
  // Save the draft data to localStorage
  const draftData = {
    drafts: drafts,
    draftPicks: draftPicks,
    tradedPicks: tradedPicks
  };
  localStorage.setItem("drafts", JSON.stringify(draftData));
}

const digestDate = (tStamp) => {
  const a = new Date(tStamp);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const year = a.getFullYear();
  const month = months[a.getMonth()];
  const date = a.getDate();
  return month + ' ' + date + ' ' + year;
}

function displayStatusMessage(message) {
  statusMessageElement.textContent = message;
}

async function main() {

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

let trades = JSON.parse(localStorage.getItem("trades"));

if (!trades) {
  displayStatusMessage("Loading trade data...");
  trades = {};
// Commented out to just test for 2022 d-nasty
  // for (const league of leagues) {
  //   const leagueTrades = await getTransactionsForLeague(league.league_id);
  //   trades[league.league_id] = leagueTrades;
  // }
const leagueTrades = await getTransactionsForLeague(784573640149762048);
trades[784573640149762048] = leagueTrades;

  localStorage.setItem("trades", JSON.stringify(trades));

  displayStatusMessage("");
}

let userDrafts = JSON.parse(localStorage.getItem("drafts"));

if(!userDrafts) {
  userDrafts = await processUserDrafts(user_id);
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

searchButton.addEventListener("click", async () => {
  const usernameInput = document.getElementById("usernameInput");
  const username = usernameInput.value.trim();
  if (username.length < 1) {
    alert("Please enter a valid username.");
    return;
  }
  let user_id = localStorage.getItem("user_id");
  if (!user_id) {
    try {
      const response = await fetch(`${baseURL}user/${username}`);
      const userData = await response.json();
      user_id = userData.user_id;
      localStorage.setItem("user_id", user_id);
    } catch (error) {
      alert("Unable to find user with that username.");
      return;
    }
  }
});

  const initialLeagueName = uniqueLeagueNames[0];
  // await displayTradesForSelectedLeague(leagues, initialLeagueName);
  processLeagueTrades(leagues[22]);
  populateLeagueDropdown(leagues);

}

main();