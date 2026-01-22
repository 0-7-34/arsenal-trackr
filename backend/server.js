// IMPORTS
import express from "express"; // like flask but for js (makes it easier to work with endpoints)
import fetch from "node-fetch";
import pkg from "pg"; // postgresql
import dotenv from "dotenv"; // houses the important data like auth keys
import path from "path";
import { fileURLToPath } from "url";

// day variable (used for API call limit)
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// getting paths and names
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// getting token and database settings from .env file
dotenv.config({
  path: path.join(__dirname, "token.env")
});

const { Pool } = pkg;
const app = express();

app.use(express.static(path.join(__dirname, "../frontend")));

// connecting the database
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: Number(process.env.PGPORT),
});

// ENDPOINTS

app.get("/api/teams/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await updateTeam(id);
    const team = await pool.query(`SELECT * FROM teams WHERE id = $1`, [id]);
    res.json(team.rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/teams/:teamId/players", async (req, res) => {
  const { teamId } = req.params;

  try {
    await updatePlayers(teamId);
    const players = await pool.query(
      `SELECT * FROM players WHERE teamid = $1 ORDER BY appearances DESC NULLS LAST, name`, [teamId]
    );
    res.json(players.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// TO DO: add formations to database
app.get("/api/formations", async (req, res) => {
  const players = await pool.query(
    `SELECT * FROM formations`
  );
  res.json(players.rows);
});

app.listen(3000, () => console.log("Server running: http://localhost:3000"));

// FUNCTIONS

async function fetchPlayers({team_id, season, apiKey }) {
  let page = 1;
  let total_pages = 1;
  const players = [];

  do {
    const res = await fetch(
      `https://v3.football.api-sports.io/players?team=${team_id}&season=${season}&page=${page}`,
      { headers: { "x-apisports-key": apiKey } }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Players API failed (page ${page}): ${text}`);
    }

    const data = await res.json();
    total_pages = data?.paging?.total ?? 1;

    players.push(...(data?.response ?? []));
    page++;
  } while (page <= total_pages);

  return players;
}

async function fetchTeam({team_id, league_id, season, apiKey }) {

  const res = await fetch(
    `https://v3.football.api-sports.io/teams/statistics?league=${league_id}&team=${team_id}&season=${season}`,
    { headers: { "x-apisports-key": apiKey }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Team's API failed: ${text}`);
  }

  const data = await res.json();
  const payload = data?.response;
  if (!payload?.team?.id) {
    console.warn("Skipping invalid team payload:", { teamId: team_id, errors: data?.errors, data });
    return null;
  }

  return payload;
}
async function updatePlayers(team_id) {
  // Check last update
  const existing = await pool.query(
    `SELECT api_updated_at FROM teams WHERE id = $1`,
    [team_id]
  );

  const last = existing.rows[0]?.team_api_updated_at;
  if (isFresh(last)) console.log("Team update skipped (fresh)");

  const players = await fetchPlayers({team_id, season: 2024, apiKey: process.env.FOOTBALL_DATA_TOKEN});

  // putting it into the database
  for (const item of players) {
    const player = item.player;
    const stats = item.statistics?.[0];

    await pool.query(
      `INSERT INTO players (id, teamid, name, age, nationality, height, "weight", photo, team, appearances, "minutes", position, rating, shirtnumber, goals, passes, tackles, dribbles, fouls, cards)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        ON CONFLICT (id)
        DO UPDATE SET
          teamid = EXCLUDED.teamid,
          name = EXCLUDED.name,
          age = EXCLUDED.age,
          nationality = EXCLUDED.nationality,
          height = EXCLUDED.height,
          "weight" = EXCLUDED."weight",
          photo = EXCLUDED.photo,
          team = EXCLUDED.team,
          appearances = EXCLUDED.appearances,
          "minutes" = EXCLUDED."minutes",
          position = EXCLUDED.position,
          rating = EXCLUDED.rating,
          shirtnumber = EXCLUDED.shirtnumber,
          goals = EXCLUDED.goals,
          passes = EXCLUDED.passes,
          tackles = EXCLUDED.tackles,
          dribbles = EXCLUDED.dribbles,
          fouls = EXCLUDED.fouls,
          cards = EXCLUDED.cards`,
      [player.id,
      stats.team.id,
      player.name, 
      player.age, 
      player.nationality,
      player.height,
      player.weight,
      player.photo,
      stats.team.name,
      stats.games.appearences,
      stats.games.minutes,
      stats.games.position,
      stats.games.rating,
      stats.games.number,
      stats.goals.total,
      stats.passes.total,
      stats.tackles.total,
      stats.dribbles.attempts,
      stats.fouls.committed,
      ((stats?.cards?.yellow ?? 0) + (stats?.cards?.red ?? 0)) || null
      ]
    );
  }

  return({ status: "Players Updated" });
}

async function updateTeam(team_id) {
  // Check last update
  const existing = await pool.query(
    `SELECT api_updated_at FROM teams WHERE id = $1`,
    [team_id]
  );

  const last = existing.rows[0]?.team_api_updated_at;
  if (isFresh(last)) console.log("Team update skipped (fresh)");

  const item = await fetchTeam({team_id, league_id: 39, season: 2024, apiKey: process.env.FOOTBALL_DATA_TOKEN});
  // putting it into the database
  await pool.query(
    `INSERT INTO teams (id, name, season, logo, league, country, wins, losses, draws, formation)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id)
      DO UPDATE SET
        name = EXCLUDED.name,
        season = EXCLUDED.season,
        logo = EXCLUDED.logo,
        league = EXCLUDED.league,
        country = EXCLUDED.country,
        wins = EXCLUDED.wins,
        losses = EXCLUDED.losses,
        draws = EXCLUDED.draws,
        formation = EXCLUDED.formation`,
    [item.team.id,
    item.team.name, 
    item.league.season, 
    item.team.logo,
    item.league.name,
    item.league.country,
    item.fixtures.wins.total,
    item.fixtures.loses.total,
    item.fixtures.draws.total,
    item.lineups[0].formation
    ]
  );

  return ({ status: "Team Updated" });
}

function isFresh(ts) {
  if (!ts) return false;
  return (Date.now() - new Date(ts).getTime()) < ONE_DAY_MS;
}