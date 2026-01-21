const formations = {
  "4-4-2": {
    GK: [50, 92],
    LB: [20, 75], LCB: [40, 78], RCB: [60, 78], RB: [80, 75],
    LM: [20, 55], LCM: [40, 58], RCM: [60, 58], RM: [80, 55],
    LS: [40, 30], RS: [60, 30]
  }, "4-3-3": {
    GK: [50, 92],
    LB: [20, 75], LCB: [40, 78], RCB: [60, 78], RB: [80, 75],
    LCM: [25, 55], CM: [50, 55], RCM: [75, 55],
    LW: [20, 30], ST: [50, 25], RW: [80, 30]
  }, "4-2-3-1": {
    GK: [50, 92],
    LB: [20, 75], LCB: [40, 78], RCB: [60, 78], RB: [80, 75],
    LCM: [25, 55], CM: [50, 55], RCM: [75, 55],
    LW: [20, 30], ST: [50, 25], RW: [80, 30]
  }, "3-4-2-1": {
    GK: [50, 92],
    LB: [20, 75], LCB: [40, 78], RCB: [60, 78], RB: [80, 75],
    LCM: [25, 55], CM: [50, 55], RCM: [75, 55],
    LW: [20, 30], ST: [50, 25], RW: [80, 30]
  }
};

// VARIABLES
let formation = "4-3-3";
const team_ids = {42: "Arsenal", 66: "Aston Villa", 35: "Bournemouth", 55: "Brentford", 51: "Brighton & Hove Albion", 49: "Chelsea", 52: "Crystal Palace", 45: "Everton", 36: "Fulham", 57: "Ipswich Town", 46: "Leicester City", 40: "Liverpool", 50: "Manchester City", 33: "Manchester United", 34: "Newcastle United", 65: "Nottingham Forest", 41: "Southampton", 47: "Tottenham Hotspur", 48: "West Ham United", 39: "Wolves"
};

// MAIN

// Creating buttons for different teams
for (const [key, value] of Object.entries(team_ids)) {
  const ul = document.querySelector(".dropdown-menu");
  const li = document.createElement("li");
  li.id = key;
  li.textContent = value;
  li.onclick = () => loadTeam(key)
  ul.appendChild(li);
}

// Default to arsenal
loadTeam(42);

// FUNCTIONS

function applyFormation(name) {
  document.querySelectorAll(".starter").forEach(p => {
    const pos = p.dataset.position;
    const coords = formations[name]?.[pos];

    if (!coords) return;

    const [x, y] = coords;
    p.style.left = `${x}vw`;
    p.style.top = `${y}vh`;
  });
}

function assignPlayersToFormation(formation, players) {
  const slots = Object.keys(formations[formation]);

  const allowedSlotsForRole = {
    Goalkeeper: ["GK"],
    Defender: ["LB", "LCB", "RCB", "RB", "LWB", "RWB"],
    Midfielder: ["LM", "LCM", "CM", "RCM", "RM", "CDM", "CAM"],
    Attacker: ["LS", "RS", "ST", "LW", "RW"]
  };

  const remaining = [...players];

  for (const pos of slots) {
    const div = document.querySelector(`[data-position="${pos}"]`);
    if (!div) continue;

    // Finding first unassigned player to go in the slot
    const idx = remaining.findIndex(p =>
      (allowedSlotsForRole[p.position] ?? []).includes(pos)
    );

    if (idx === -1) continue;

    const p = remaining.splice(idx, 1)[0];

    div.innerHTML = `
      <img src="${p.photo}">
      <span class="name">${p.name ?? ""}</span>
    `;
    div.onclick = () => playerCard(p);
  }
  benchPlayers(remaining);
}

function benchPlayers(players) {
  const list = document.getElementById("players-list");
  list.innerHTML = "";

  for (const p of players) {
    const div = document.createElement("div");
    div.className = "player";
    div.onclick = () => playerCard(p);

    div.innerHTML = `
      <img src="${p.photo}">
      <span>${p.name ?? "data unavailable"}</span>
      <span>Age: ${p.age}</span>
      <span>Nationality: ${p.nationality}</span>
      <span>Height: ${p.height}cm</span>
      <span>Weight: ${p.weight}kg</span>
      <span>Team: ${p.team}</span>
      <span>Appearances: ${p.appearances}</span>
      <span>Played: ${p.minutes} minutes</span>
      <span>Plays as: ${p.position ?? "data unavailable"}</span>
      <span>Season rating: ${p.rating ?? "data unavailable"}</span>
      <span>Shirt No. ${p.shirtnumber ?? "data unavailable"}</span>
      <span>Goals: ${p.goals ?? 0}</span>
      <span>Passes: ${p.passes ?? 0}</span>
      <span>Tackles: ${p.tackles ?? 0}</span>
      <span>Dribbles: ${p.dribbles ?? 0}</span>
      <span>Fouls committed: ${p.fouls ?? 0}</span>
      <span>Cards recieved: ${p.cards ?? 0}</span>
    `;
    list.appendChild(div);
  }
}

function buildPitchSlots(formation) {
  const pitch = document.getElementById("pitch");
  pitch.innerHTML = "";

  if (!formation) throw new Error("No formation");

  for (const pos of Object.keys(formations[formation])) {
    const div = document.createElement("div");
    div.className = "starter";
    div.dataset.position = pos;

    div.innerHTML = `
      <img src="">
      <span class="name"></span>
    `;

    pitch.appendChild(div);
  }
  applyFormation(formation);
}

function changeLogo(logo) {
  document.getElementById("head-icon").href = logo;
  document.getElementById("icon").src = logo;
}

function loadTeam(teamId) {
  fetch(`/api/teams/${teamId}`)
  .then(res => res.json())
  .then(team => {
    document.getElementById("team-info").innerHTML = `
      <h4>${team.season} ${team.name}</h4>
      <p><strong>Formation:</strong> ${team.formation}</p>
    `;
    // Set formation to the specific team's formation
    formation = team.formation;
    buildPitchSlots(formation);
    changeLogo(team.logo);

    return fetch(`/api/teams/${teamId}/players`);
  })
  .then(res => res.json())
  .then(players => {
    assignPlayersToFormation(formation, players);
  })
  .catch(err => console.error("Players fetch failed:", err  
));
}

function playerCard(player) {
  const existing = document.querySelector(".overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.className = "overlay";

  const popup = document.createElement("div");
  popup.className = "popup";

  popup.innerHTML = `
    <img src="${player.photo}">
    <h2>${player.name}</h2>
    <p>${player.position ?? "Unknown position"}</p>
    <p>Age: ${player.age}</p>
    <p>Nationality: ${player.nationality}</p>
  `;

  overlay.appendChild(popup);
  document.body.appendChild(overlay);

  overlay.addEventListener("click", (e) => {
    if (e.currentTarget === overlay) {
      overlay.remove();
    }
  });

  function onKeyDown(e) {
    if (e.key === "Escape") cleanup();
  }
  document.addEventListener("keydown", onKeyDown);

  function cleanup() {
    overlay.remove();
    document.removeEventListener("keydown", onKeyDown);
  }
}