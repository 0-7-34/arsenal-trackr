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
// default
applyFormation("4-3-3");


//Database

fetch("/api/arsenal")
  .then(res => res.json())
  .then(team => {
    const el = document.getElementById("teamInfo");
    el.innerHTML = `
      <h3>${team.name}</h3>
      <p><strong>Year:</strong> ${team.season ?? "N/A"}</p>
      <p><strong>League:</strong> ${team.league ?? "N/A"}</p>
      <p><strong>Country:</strong> ${team.country ?? "N/A"}</p>
      <p><strong>Wins:</strong> ${team.wins ?? "N/A"}</p>
      <p><strong>Losses:</strong> ${team.losses ?? "N/A"}</p>
      <p><strong>Draws:</strong> ${team.draws ?? "N/A"}</p>
      <p><strong>Formation:</strong> ${team.formation ?? "N/A"}</p>
    `;
  })
  .catch(err => console.error("Team fetch failed:", err));

fetch("/api/arsenal/players")
  .then(res => res.json())
  .then(players => {
    const container = document.getElementById("playersList");
    container.innerHTML = ""; // clear

    // Simple table (clean + easy)
    const table = document.createElement("table");
    table.innerHTML = `
      <thead>
        <tr>
          <th>#</th>
          <th>Name</th>
          <th>Age</th>
          <th>Nationality</th>
          <th>Height</th>
          <th>Weight</th>
          <th>Team</th>
          <th>Appearances</th>
          <th>Minutes</th>
          <th>Position</th>
          <th>Rating</th>
          <th>Shirt Number</th>
          <th>Goals</th>
          <th>Passes</th>
          <th>Tackles</th>
          <th>Dribbles</th>
          <th>Fouls</th>
          <th>Cards</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector("tbody");

    players.forEach(p => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${p.id}</td>
        <td>${p.name}</td>
        <td>${p.age}</td>
        <td>${p.nationality}</td>
        <td>${p.height}</td>
        <td>${p.weight}</td>
        <td>${p.team}</td>
        <td>${p.appearances}</td>
        <td>${p.minutes}</td>
        <td>${p.position ?? ""}</td>
        <td>${p.rating ?? ""}</td>
        <td>${p.shirtnumber ?? ""}</td>
        <td>${p.goals ?? ""}</td>
        <td>${p.passes ?? ""}</td>
        <td>${p.tackles ?? ""}</td>
        <td>${p.dribbles ?? ""}</td>
        <td>${p.fouls ?? ""}</td>
        <td>${p.cards ?? ""}</td>
      `;
      tbody.appendChild(tr);
    });

    container.appendChild(table);
  })
  .catch(err => console.error("Players fetch failed:", err));

async function loadPlayers() {
  const res = await fetch("/api/arsenal/players");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const players = await res.json();

  const list = document.getElementById("playersList");

  function render(filtered) {
    list.innerHTML = "";

    if (!filtered.length) {
      list.innerHTML = "<li>No players found.</li>";
      return;
    }

    for (const p of filtered) {
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

  // initial render
  render(players);
}

document.addEventListener("DOMContentLoaded", () => {
  loadPlayers().catch(err => {
    console.error(err);
    const list = document.getElementById("playersList");
    if (list) list.innerHTML = `<li>Error loading players: ${err.message}</li>`;
  });
});
