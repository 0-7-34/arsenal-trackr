// imports
import express from "express"; // like flask but for js (makes it easier to work with endpoints)
import fetch from "node-fetch";
import pkg from "pg"; // postgresql
import dotenv from "dotenv"; // houses the important data like auth keys
import path from "path";
import { fileURLToPath } from "url";

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

// PREM TEAMS IN 2024


// ENDPOINTS
app.get("/api/update-arsenal", async (req, res) => {
  // getting team data from API
  // TEAM
  try {
    const team_response = await fetch("https://v3.football.api-sports.io/teams/statistics?league=39&team=42&season=2024", {
      headers: { "x-apisports-key": process.env.FOOTBALL_DATA_TOKEN }
    }); // auth key and API endpoint to fetch data

    if (!team_response.ok) {
      const text = await team_response.text();
      return res.status(team_response.status).send(text);
    } // aborting if team does not provide fields

    // handling the response of the API query
    const data = await team_response.json();
    const response = data?.response;

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
      [response.team.id,
       response.team.name, 
       response.league.season, 
       response.team.logo,
       response.league.name,
       response.league.country,
       response.fixtures.wins.total,
       response.fixtures.loses.total,
       response.fixtures.draws.total,
       response.lineups[0].formation
      ]
    );
  } catch (e) {
    console.error(e);
  }

  //PLAYERS
  try {
    const players = await fetchAllPlayers({teamId: 42, season: 2024, apiKey: process.env.FOOTBALL_DATA_TOKEN});

    // putting it into the database
    for (const item of players) {
      const player = item.player;
      const stats = item.statistics?.[0];

      await pool.query(
        `INSERT INTO players (id, name, age, nationality, height, "weight", photo, team, appearances, "minutes", position, rating, shirtnumber, goals, passes, tackles, dribbles, fouls, cards)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
          ON CONFLICT (id)
          DO UPDATE SET
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
    //success message
    res.json({ status: "Team & Players Updated" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Update failed", details: String(e) });
  }  
});

app.get("/api/arsenal", async (req, res) => {
  const team = await pool.query("SELECT * FROM teams WHERE id = 42");
  res.json(team.rows[0] || null);
});

app.get("/api/arsenal/players", async (req, res) => {
  const players = await pool.query(
    `SELECT * FROM players ORDER BY appearances DESC NULLS LAST, name`
  );
  res.json(players.rows);
});

// TO DO: add formations to database
app.get("/api/formations", async (req, res) => {
  const players = await pool.query(
    `SELECT * FROM formations`
  );
  res.json(players.rows);
});

app.listen(3000, () => console.log("Server running: http://localhost:3000"));

async function fetchAllPlayers({ teamId, season, apiKey }) {
  let page = 1;
  let totalPages = 1;
  const players = [];

  do {
    const res = await fetch(
      `https://v3.football.api-sports.io/players?team=${teamId}&season=${season}&page=${page}`,
      { headers: { "x-apisports-key": apiKey } }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Players API failed (page ${page}): ${text}`);
    }

    const data = await res.json();
    totalPages = data?.paging?.total ?? 1;

    players.push(...(data?.response ?? []));
    page++;
  } while (page <= totalPages);

  return players;
}