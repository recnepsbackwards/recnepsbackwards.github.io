const user_id = "";
const baseURL = "https://api.sleeper.app/v1/";
const tradeDataElement = document.getElementById("tradeData");
const leagueSelectElement = document.getElementById("leagueSelect");
const yearSelectElement = document.getElementById("yearSelect");
const usernameInputElement = document.getElementById("usernameInput");
const statusMessageElement = document.getElementById("statusMessage");
const leagueYearSelectContainerElement = document.getElementById("leagueYearSelectContainer");
const searchButton = document.getElementById("searchButton");
const usernameDisplay = document.getElementById('usernameDisplay');
const usernameText = document.getElementById('usernameText');
const changeUsername = document.getElementById('changeUsername');
const blankState = document.getElementById('blankState');
let leagues = [];

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
async function handleBlankState(e) {
  const allShownTrades = document.querySelectorAll('.show-trade');
  console.log(e);
  if((e === true && allShownTrades.length === 0) || tradeDataElement.dataset.hasTrades === "false") {
    blankState.classList.remove('hidden');
  }
  else {
    blankState.classList.add('hidden');
  }
}
async function handleCheckbox(e) {
  const allHiddenTrades = document.querySelectorAll('.hide-trade');
  if (e.target.checked) {
    handleBlankState(e.target.checked);
    for (let i = 0; i < allHiddenTrades.length; i++) {
      allHiddenTrades[i].style.display = "none";
    }
  } else {
    handleBlankState(e.target.checked);
    for (let i = 0; i < allHiddenTrades.length; i++) {
      allHiddenTrades[i].style.display = "block";
    }
  }
}
usernameDisplay.addEventListener("change", function(e) {
  handleCheckbox(e); // Call the handleCheckbox function with the event object
});
changeUsername.addEventListener("click", function() {
  localStorage.clear();
  usernameText.parentElement.classList.add('hidden');
  usernameInputElement.parentElement.classList.remove('hidden');
  leagueSelectElement.parentElement.classList.add('hidden');
  yearSelectElement.parentElement.classList.add('hidden');
  leagueSelectElement.innerHTML = "";
  yearSelectElement.innerHTML = "";
  tradeDataElement.innerHTML = "";
});

async function getLeagues(userId) {
  const leagues = [];
  console.log(userId);
  for (let year = 2017; year <= new Date().getFullYear(); year++) {
    const response = await fetch(baseURL + "user/" + userId + "/leagues/nfl/" + year);
    const yearlyLeagues = await response.json();

    yearlyLeagues.forEach((league) => {
      const leagueName = league.name;
      const leagueId = league.league_id
      const existingLeague = leagues.find((item) => item.leagueName === leagueName);
      if (existingLeague) {
        const existingYear = existingLeague.years.find((item) => item.year === year);
        if (existingYear) {
          existingYear.leagues.push(league);
        } else {
          existingLeague.years.push({ year, leagues: [league] });
        }
      } else {
        leagues.push({
          leagueName,
          leagueId,
          years: [{ year, leagues: [league] }]
        });
      }
    });
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
function displayTradeInfo(playerTradeInfo) {
  const tradeElement = document.createElement("div");
  tradeElement.classList.add("trade");

  const tradeTable = document.createElement("table");
  tradeElement.appendChild(tradeTable);

  const tradeTimestamp = document.createElement("div");
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
    tradeSlot.style.backgroundImage = `url(${player.playerImage})`, `url(https://sleepercdn.com/images/v2/icons/player_default.webp)`;
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
      tradeSpanRight.textContent = player.originalOwnerDisplayName;
      tradeSpanLeft.textContent = player.newOwnerDisplayName;
    }
    else {
      tradeTableCellRight.appendChild(playerCell);
      tradeSpanLeft.textContent = player.originalOwnerDisplayName;
      tradeSpanRight.textContent = player.newOwnerDisplayName;
    }

    tradeTimestamp.textContent = player.timestamp;
    let userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if(player.originalOwnerDisplayName.toLowerCase() != userInfo[0].username && player.newOwnerDisplayName.toLowerCase() != userInfo[0].username) {
      tradeElement.classList.add("hide-trade");
    }
    else {
      tradeElement.classList.add("show-trade");
    }
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
  const selectedLeague = leagues.find((league) => league.leagueName === selectedLeagueName);
  if (selectedLeague) {
    const uniqueYears = selectedLeague.years.map((year) => year.year).sort((a, b) => b - a);
    return uniqueYears;
  }
  return [];
}


function populateLeagueDropdown(leagues) {
  // Create an array to store unique league names
  const uniqueLeagueNames = [];

  // Clear the leagueSelectElement
  leagueSelectElement.innerHTML = "";
  // Loop through the leagues and add unique names to the array and options to the select element
  for (const league of leagues) {
    if (!uniqueLeagueNames.includes(league.leagueName)) {
      uniqueLeagueNames.push(league.leagueName);

      const option = document.createElement("option");
      option.value = league.leagueName;
      option.text = league.leagueName;
      leagueSelectElement.add(option);
    }
  }
  leagueSelectElement.parentElement.classList.remove('hidden');
  usernameInputElement.parentElement.classList.add('hidden');
  usernameText.parentElement.classList.remove('hidden');
}


function populateYearDropdown(leagueName) {
  const selectedLeague = leagues.find((league) => league.leagueName === leagueName);

  if (selectedLeague && selectedLeague.years.length > 0) {
    const uniqueYears = selectedLeague.years.map((year) => year.year);
    const reversedYears = uniqueYears.reverse();
    yearSelectElement.innerHTML = reversedYears.map((year) => `<option value="${year}">${year}</option>`).join("");

    yearSelectElement.parentElement.classList.remove('hidden');
    usernameDisplay.parentElement.classList.remove('hidden');
  } else {
    yearSelectElement.innerHTML = "";
    yearSelectElement.parentElement.classList.add('hidden');
  }
}

async function displayTradesForYear(leagues, selectedLeagueName, year) {
  tradeDataElement.innerHTML = "";
  const selectedLeague = leagues.find((league) => league.leagueName === selectedLeagueName);
  if (selectedLeague) {
    const yearHeader = document.createElement("h4");
    yearHeader.textContent = selectedLeagueName + " - " + year;
    tradeDataElement.appendChild(yearHeader);
    const leaguesForYear = selectedLeague.years.filter((leagueYear) => leagueYear.year === year);
    for (const leagueYear of leaguesForYear) {
      const league = leagueYear.leagues[0];
      await processLeagueTrades(league);
    }
  }
  handleCheckbox({ target: { checked: usernameDisplay.checked } }); // Manually trigger the function call with an event-like object
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
  let leagueTrades = await getLeagueTrades(league.league_id);
  const leagueUsers = await getLeagueTradesUsers(league.league_id);

  if (leagueTrades.length > 0) {
    leagueTrades = leagueTrades.sort((a,b) => b.status_updated - a.status_updated);
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
          const originalOwner = leagueUsers.find((user) => user.roster_id === originalOwnerRosterId);
          const newOwner = leagueUsers.find((user) => user.roster_id === newOwnerRosterId);
          const originalOwnerDisplayName = originalOwner ? originalOwner.display_name : "";
          const newOwnerDisplayName = newOwner ? newOwner.display_name : "";

          return {
            playerName,
            playerPosition,
            playerImage,
            teamName,
            timestamp,
            originalOwnerDisplayName,
            newOwnerDisplayName,
            originalOwnerRosterId,
            newOwnerRosterId,
          };
        });

        if (trade.draft_picks) {
          for (const draftPick of trade.draft_picks) {
            const timestamp = digestDate(trade.status_updated);
            const originalOwnerRosterId = draftPick.previous_owner_id;
            const newOwnerRosterId = draftPick.owner_id;
            const originalOwner = leagueUsers.find((user) => user.roster_id === originalOwnerRosterId);
            const newOwner = leagueUsers.find((user) => user.roster_id === newOwnerRosterId);
            const originalOwnerDisplayName = originalOwner ? originalOwner.display_name : "";
            const newOwnerDisplayName = newOwner ? newOwner.display_name : "";
            const playerImage = "https://sleepercdn.com/images/v2/icons/player_default.webp";
            const playerName = `${draftPick.round}${getNumEnd(draftPick.round)} round pick`;
            const playerPosition = draftPick.season;
            const teamName = "N/A";
            
            const newDraftPick = {
              timestamp,
              originalOwnerDisplayName,
              newOwnerDisplayName,
              originalOwnerRosterId,
              newOwnerRosterId,
              playerImage,
              playerName,
              playerPosition,
              teamName,
            };

            playerTradeInfo.push(newDraftPick);
          }
        }
        displayTradeInfo(playerTradeInfo);
      }
    }
    tradeDataElement.dataset.hasTrades = "true";
  }
  else {
    tradeDataElement.dataset.hasTrades = "false";
    handleBlankState();
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
  statusMessageElement.classList.remove('hidden');
}
function hideStatusMessage() {
  statusMessageElement.classList.add('hidden');
}

async function main() {

  async function start(user_id) {
    leagues = JSON.parse(localStorage.getItem("leagues"));

    if (!leagues) {
      leagues = await getLeagues(user_id);
      localStorage.setItem("leagues", JSON.stringify(leagues));
    }

    let trades = JSON.parse(localStorage.getItem("trades"));

    if (!trades) {
      displayStatusMessage("Loading leagues...");
      trades = {};
      for (const league of leagues) {
        const leagueTrades = await getTransactionsForLeague(league.leagueId);
        trades[league.league_id] = leagueTrades;
      }

      localStorage.setItem("trades", JSON.stringify(trades));

      hideStatusMessage();
    }
    // When a new league is selected from the dropdown
    leagueSelectElement.addEventListener("change", async (event) => {
      const selectedLeagueName = event.target.value;
      const latestYear = await getUniqueYears(leagues, selectedLeagueName);
      populateYearDropdown(selectedLeagueName);
      displayStatusMessage("Loading latest year of trades...");
      await displayTradesForYear(leagues, selectedLeagueName, latestYear[0]);
      yearSelectElement.parentElement.classList.remove('hidden');
      hideStatusMessage();
    });

    // When a new year is selected from the year dropdown
    yearSelectElement.addEventListener("change", async (event) => {
      displayStatusMessage("Loading year...");
      const selectedYear = parseInt(event.target.value);
      const selectedLeagueName = leagueSelectElement.value;
      await displayTradesForYear(leagues, selectedLeagueName, selectedYear);
      hideStatusMessage();
    });
    populateLeagueDropdown(leagues);
    const selectedLeagueName = leagueSelectElement.value;
    const latestYear = await getUniqueYears(leagues, selectedLeagueName);
    await displayTradesForYear(leagues, selectedLeagueName, latestYear[0]);
    populateYearDropdown(selectedLeagueName);
  }



  searchButton.addEventListener("click", async () => {
    const usernameInput = document.getElementById("usernameInput");
    const username = usernameInput.value.trim().toLowerCase();
    const userArray = [];
    if (username.length < 1) {
      alert("Please enter a valid username.");
      return;
    }
    try {
      const response = await fetch(`${baseURL}user/${username}`);
      const userData = await response.json();
      userArray.push({
        user_identification: userData.user_id,
        username: username
      })
      localStorage.setItem("userInfo", JSON.stringify(userArray));
      start(userData.user_id);
    } catch (error) {
      alert("Unable to find user with that username.");
      return;
    }
  });
  let userInfo = JSON.parse(localStorage.getItem("userInfo"));
  if(userInfo) {
    start(userInfo[0].user_identification);
  }

}

main();