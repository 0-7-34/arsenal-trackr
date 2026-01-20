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
  }
};

// MAIN
let formation = null;
// Different teams
fetch("/api/arsenal")
  .then(res => res.json())
  .then(team => {
    document.getElementById("team-info").innerHTML = `
      <h4>${team.season} ${team.name}</h4>
      <p><strong>Formation:</strong> ${team.formation}</p>
    `;
    // Set formation to the specific team's formation
    formation = team?.formation ?? "4-3-3";
    buildPitchSlots(formation);
  });

fetch("/api/arsenal/players")
  .then(res => res.json())
  .then(players => {
    assignPlayersToFormation(formation, players);
  })
  .catch(err => console.error("Players fetch failed:", err));

// Functions

function applyFormation(name) {
  document.querySelectorAll(".player").forEach(p => {
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
  }
  benchPlayers(remaining);
}

function benchPlayers(players) {
  const list = document.getElementById("playersList");
  list.innerHTML = "";

  for (const p of players) {
    const li = document.createElement("li");
    li.className = "player-card";

    li.innerHTML = `
      <div class="player-name">${p.name}</div>
      <div class="player-meta">
        <span class="pill">${p.age}</span>
        <span class="pill">${p.nationality}</span>
        <span class="pill">${p.height}</span>
        <span class="pill">${p.weight}</span>
        <span class="pill">${p.team}</span>
        <span class="pill">${p.appearances}</span>
        <span class="pill">${p.minutes}</span>
        <span class="pill">${p.position ?? ""}</span>
        <span class="pill">${p.rating ?? ""}</span>
        <span class="pill">${p.shirtnumber ?? ""}</span>
        <span class="pill">${p.goals ?? ""}</span>
        <span class="pill">${p.passes ?? ""}</span>
        <span class="pill">${p.tackles ?? ""}</span>
        <span class="pill">${p.dribbles ?? ""}</span>
        <span class="pill">${p.fouls ?? ""}</span>
        <span class="pill">${p.cards ?? ""}</span>
      </div>
    `;
    list.appendChild(li);
  }
}

function buildPitchSlots(formation) {
  const pitch = document.getElementById("pitch");
  pitch.innerHTML = "";

  if (!formation) throw new Error("No formation");

  for (const pos of Object.keys(formations[formation])) {
    const div = document.createElement("div");
    div.className = "player";
    div.dataset.position = pos;

    div.innerHTML = `
      <img src="">
      <span class="name"></span>
    `;

    pitch.appendChild(div);
  }
  applyFormation(formation);
}
