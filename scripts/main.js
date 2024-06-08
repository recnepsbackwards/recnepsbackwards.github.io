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
  blankState.classList.add('hidden');
  usernameDisplay.parentElement.classList.add('hidden');
  leagueSelectElement.innerHTML = "";
  yearSelectElement.innerHTML = "";
  tradeDataElement.innerHTML = "";
});

async function getLeagues(userId) {
  const leagues = [];
  const currentYear = new Date().getFullYear();
  const yearPromises = [];

  for (let year = 2017; year <= currentYear; year++) {
    yearPromises.push(fetch(baseURL + "user/" + userId + "/leagues/nfl/" + year).then(response => response.json()));
  }

  const yearlyLeagues = await Promise.all(yearPromises);

  yearlyLeagues.forEach((yearlyLeague, index) => {
    yearlyLeague.forEach(league => {
      const leagueName = league.name;
      const leagueId = league.league_id;
      const existingLeague = leagues.find(item => item.leagueName === leagueName);
      const year = 2017 + index;

      if (existingLeague) {
        const existingYear = existingLeague.years.find(item => item.year === year);
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
  });

  return leagues;
}




async function getTransactionsForLeague(leagueId) {
  const maxWeeks = 18;
  const weekPromises = [];

  for (let week = 1; week <= maxWeeks; week++) {
    weekPromises.push(fetch(baseURL + "league/" + leagueId + "/transactions/" + week).then(response => response.json()));
  }

  const weeklyTransactions = await Promise.all(weekPromises);
  const transactions = [];

  weeklyTransactions.forEach(weeklyTransaction => {
    const trades = weeklyTransaction.filter(transaction => transaction.type === "trade");
    transactions.push(...trades);
  });

  return transactions;
}

function displayTradeInfo(playerTradeInfo) {
  let valueTotal1 = 0;
  let valueTotal2 = 0;
  let tradeTableCellLeft, tradeTableCellRight, tradeTableRow, tradeTableBody, emptyCellsLeft, emptyCellsRight;


  const tradeElement = document.createElement("div");
  tradeElement.classList.add("trade");

  tradeDataElement.appendChild(tradeElement);

  const tradeTable = document.createElement("table");
  tradeElement.appendChild(tradeTable);

  const tradeTimestamp = document.createElement("div");
  tradeTimestamp.classList.add("trade-timestamp");
  tradeElement.prepend(tradeTimestamp);

  const tradeCalculator = document.createElement("div");
  tradeCalculator.classList.add("trade-calculator");
  tradeElement.appendChild(tradeCalculator);

  const tradeText = document.createElement("span");
  tradeText.classList.add("trade-text");
  tradeCalculator.appendChild(tradeText);

  const tradeAmount = document.createElement("span");
  tradeAmount.classList.add("trade-amount");
  tradeCalculator.appendChild(tradeAmount);

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

  tradeTableBody = document.createElement("tbody");
  tradeTable.appendChild(tradeTableBody);

  let rowAmount = Math.max(playerTradeInfo.teamOne.length, playerTradeInfo.teamTwo.length);
  
  for (var key in playerTradeInfo) {
    const arr = playerTradeInfo[key];
    for (var i=0; i<arr.length; i++) {
      if(rowAmount > 0) {
        rowAmount--;
        tradeTableRow = document.createElement("tr");
        tradeTableBody.appendChild(tradeTableRow);
    
        tradeTableCellLeft = document.createElement("td");
        tradeTableRow.appendChild(tradeTableCellLeft);
        tradeTableCellLeft.classList.add('empty-cell-left');
    
        tradeTableCellRight = document.createElement("td");
        tradeTableRow.appendChild(tradeTableCellRight);
        tradeTableCellRight.classList.add('empty-cell-right');

      }
      const player = arr[i];

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
  
      const playerValue = document.createElement("div");
      playerValue.classList.add("player-value");
      playerValue.textContent = player.playerValue || 0;
      playerSlot.appendChild(playerValue); 

      if(key === "teamOne") {
          emptyCellsLeft = document.querySelectorAll(".empty-cell-left");
          valueTotal1+= arr[i].playerValue;
          tradeSpanRight.textContent = player.originalOwnerDisplayName;
          tradeSpanLeft.textContent = player.newOwnerDisplayName;
          if(emptyCellsLeft.length > 0) {
            emptyCellsLeft[0].appendChild(playerCell);
            emptyCellsLeft[0].classList.remove('empty-cell-left');
          }
          else {
            tradeTableCellLeft.appendChild(playerCell);
          }
        }
        else {
          emptyCellsRight = document.querySelectorAll(".empty-cell-right");
          valueTotal2+= arr[i].playerValue;
          tradeSpanLeft.textContent = player.originalOwnerDisplayName;
          tradeSpanRight.textContent = player.newOwnerDisplayName;
          if(emptyCellsRight.length > 0) {
            emptyCellsRight[0].appendChild(playerCell);
            emptyCellsRight[0].classList.remove('empty-cell-right');
          }
          else {
            tradeTableCellRight.appendChild(playerCell);
          }
        }

      tradeTimestamp.textContent = player.timestamp;
      let userInfo = JSON.parse(localStorage.getItem("userInfo"));
      if(player.originalOwnerDisplayName.toLowerCase() != userInfo[0].username && player.newOwnerDisplayName.toLowerCase() != userInfo[0].username) {
        tradeElement.classList.add("hide-trade");
      }
      else {
        tradeElement.classList.add("show-trade");
      }
    }

  };
  emptyCellsRight = document.querySelectorAll(".empty-cell-right");
  emptyCellsLeft = document.querySelectorAll(".empty-cell-left");
  for(var i = 0; i < emptyCellsRight.length; i++) {
    emptyCellsRight[i].classList.remove('empty-cell-right');
  }
  for(var j = 0; j < emptyCellsLeft.length; j++) {
    emptyCellsLeft[j].classList.remove('empty-cell-left');
  }
  if(valueTotal1 > valueTotal2) {
    const leftArrow = document.createElement("span");
    leftArrow.classList.add("material-symbols-outlined", "trade-arrow");
    leftArrow.innerHTML = "arrow_left_alt";
    tradeCalculator.prepend(leftArrow);
    finalTotal = valueTotal1-valueTotal2;
    tradeText.textContent = "Favors Team One by ";
    tradeAmount.textContent = finalTotal;
  }
  else {
    if(valueTotal1 < valueTotal2) {
      const arrowRight = document.createElement("span");
      arrowRight.classList.add("material-symbols-outlined", "trade-arrow");
      arrowRight.innerHTML = "arrow_right_alt";
      tradeCalculator.appendChild(arrowRight);
      finalTotal = valueTotal2-valueTotal1;
      tradeText.textContent = "Favors Team Two by ";
      tradeAmount.textContent = finalTotal;
    }
    else {
      tradeCalculator.classList.add("even-arrow");
      tradeText.innerHTML = "Exactly even trade";
    }
  }
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
    yearHeader.classList.add('yearHeader');
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
  
function getValueBySleeperId(sleeperId) {
  const playerInfo = fantasyCalcData.find(player => player.sleeperId === sleeperId);
  return playerInfo ? playerInfo.value : null;
}
function getValueByDraftPick(pickNumber) {
  switch (pickNumber) {
    case 1:
        return 3686;
    case 2:
        return 1646;
    case 3:
        return 1060;
    default:
        return 755;
  }
}

function getPlayerInfoBySleeperId(dataArray, sleeperId) {
  return dataArray.find(player => player.sleeperId === sleeperId) || null;
}

// async function mapPlayerToDraftPick(leagueId, draftPick) {
//   const getAllDraftsForLeague = await fetch(`${baseURL}league/${leagueId}/drafts`);
//   for(var i=0; i<getAllDraftsForLeague.length; i++) {
//     var specificLeague = getAllDraftsForLeague[i].draft_id;
//     const getSpecificDraftForLeague = await fetch(`${baseURL}draft/${specificLeague}`);
//     // draftPick can have many entries [[pick1][pick2]]
//     // need to search through each specific draft with each pick until finding a match then return the info to process trade
//     // use the returned slot_to_roster_id then we GET https://api.sleeper.app/v1/draft/<draft_id>/picks
//   }
// }

async function processLeagueTrades(league) {
  let leagueTrades = await getLeagueTrades(league.league_id);
  const leagueUsers = await getLeagueTradesUsers(league.league_id);

  if (leagueTrades.length > 0) {
    leagueTrades = leagueTrades.sort((a, b) => b.status_updated - a.status_updated);

    for (const trade of leagueTrades) {
      const playerTradeInfo = {
        teamOne: [],
        teamTwo: []
      };
      function groupedTradeData(currentData) {
        if(currentData.newOwnerRosterId < currentData.originalOwnerRosterId) {
          playerTradeInfo.teamOne.push(currentData);
        }
        else {
          playerTradeInfo.teamTwo.push(currentData);
        }
      }
      if (trade.adds && typeof trade.adds === "object") {
        for (const [playerId] of Object.entries(trade.adds)) {

          const playerObj = getPlayerInfoBySleeperId(fantasyCalcData, playerId);

          let playerName = playerObj ? playerObj.name : "Unknown Player";
          let playerImage = playerObj ? `https://sleepercdn.com/content/nfl/players/thumb/${playerId}.jpg` : "https://sleepercdn.com/images/v2/icons/player_default.webp";
          let teamName = playerObj ? playerObj.team : "N/A";
          let playerPosition = playerObj ? playerObj.position : "N/A";
          let teamLogo = teamName ? `https://sleepercdn.com/images/team_logos/nfl/${teamName.toLowerCase()}.png` : "";

          if (playerPosition === "DEF") {
            playerImage = teamLogo;
            playerName = `${playerObj.name}`;
          }

          const timestamp = digestDate(trade.status_updated);
          const originalOwnerRosterId = trade.drops && trade.drops[playerId];
          const newOwnerRosterId = trade.adds[playerId];
          const originalOwner = leagueUsers.find((user) => user.roster_id === originalOwnerRosterId);
          const newOwner = leagueUsers.find((user) => user.roster_id === newOwnerRosterId);
          const originalOwnerDisplayName = originalOwner ? originalOwner.display_name : "";
          const newOwnerDisplayName = newOwner ? newOwner.display_name : "";
          const playerValue = playerObj ? getValueBySleeperId(playerId) : 0;
          const objectInfo = {
            playerName,
            playerPosition,
            playerImage,
            playerValue,
            teamName,
            timestamp,
            originalOwnerDisplayName,
            newOwnerDisplayName,
            originalOwnerRosterId,
            newOwnerRosterId,
          }
          groupedTradeData(objectInfo);
        }
      }

      if (trade.draft_picks) {
        // const actualPlayer = mapPlayerToDraftPick(league.league_id, trade.draft_picks);
        console.log(trade.draft_picks);
        for (const draftPick of trade.draft_picks) {
          const timestamp = digestDate(trade.status_updated);
          const originalOwnerRosterId = draftPick.previous_owner_id;
          const newOwnerRosterId = draftPick.owner_id;
          const originalOwner = leagueUsers.find((user) => user.roster_id === originalOwnerRosterId);
          const newOwner = leagueUsers.find((user) => user.roster_id === newOwnerRosterId);
          const originalOwnerDisplayName = originalOwner ? originalOwner.display_name : "";
          const newOwnerDisplayName = newOwner ? newOwner.display_name : "";
          const playerValue = getValueByDraftPick(draftPick.round);

          const newDraftPick = {
            timestamp,
            originalOwnerDisplayName,
            newOwnerDisplayName,
            originalOwnerRosterId,
            newOwnerRosterId,
            playerValue,
            playerImage: "https://sleepercdn.com/images/v2/icons/player_default.webp",
            playerName: `${draftPick.round}${getNumEnd(draftPick.round)} round pick`,
            playerPosition: draftPick.season,
            teamName: "N/A",
          };

          groupedTradeData(newDraftPick);

        }
      }
      if (Object.keys(playerTradeInfo).length > 0) {
        displayTradeInfo(playerTradeInfo);
      }
    }
    tradeDataElement.dataset.hasTrades = "true";
  } else {
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
function handleButtonDisable() {
  if(usernameInputElement.disabled === true && searchButton.disabled === true) {
    usernameInputElement.disabled = false;
    searchButton.disabled = false;
  }
  else {
    usernameInputElement.disabled = true;
    searchButton.disabled = true;
  }
  
}

async function main() {

  async function start(user_id, user_name) {
    leagues = JSON.parse(localStorage.getItem("leagues"));
    usernameText.innerHTML = "Username: " + user_name;
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
      blankState.classList.add('hidden');
      document.querySelector('.yearHeader').innerText = "";
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
      handleButtonDisable();
      const response = await fetch(`${baseURL}user/${username}`);
      const userData = await response.json();
      userArray.push({
        user_identification: userData.user_id,
        username: username
      })
      localStorage.setItem("userInfo", JSON.stringify(userArray));
      start(userData.user_id, username);
    } catch (error) {
      handleButtonDisable();
      alert("Unable to find user with that username.");
      return;
    }
  });
  let userInfo = JSON.parse(localStorage.getItem("userInfo"));
  if(userInfo) {
    start(userInfo[0].user_identification, userInfo[0].username);
  }

}

main();