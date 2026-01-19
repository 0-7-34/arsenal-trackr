import express from "express";
import fetch from "node-fetch";
import pkg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, "token.env")
});

const { Pool } = pkg;
const app = express();

app.use(express.static(path.join(__dirname, "../frontend")));

// LOGIN DETAILS
const pool = new Pool({
  user: process.env.PGUSER || "postgres",
  host: process.env.PGHOST || "localhost",
  database: process.env.PGDATABASE || "mydb",
  password: process.env.PGPASSWORD || "password",
  port: Number(process.env.PGPORT || 5432),
});

// FETCHING FROM FOOTBALL-DATA API AND STORING IT IN THE DATABASE
app.get("/api/update-arsenal", async (req, res) => {
  console.log("Token exists?", Boolean(process.env.FOOTBALL_DATA_TOKEN));
  try {
    const response = await fetch("https://api.football-data.org/v4/teams/57", {
      headers: { "X-Auth-Token": process.env.FOOTBALL_DATA_TOKEN },
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).send(text);
    }

    const data = await response.json();

    await pool.query(
      `INSERT INTO teams (id, name, venue, founded)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id)
       DO UPDATE SET
         name = EXCLUDED.name,
         venue = EXCLUDED.venue,
         founded = EXCLUDED.founded`,
      [data.id, data.name, data.venue, data.founded]
    );

    for (const player of data.squad || []) {
      await pool.query(
        `INSERT INTO players (id, team_id, name, "dateOfBirth", position, "shirtNumber", nationality, "currentTeam")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id)
         DO UPDATE SET
           team_id = EXCLUDED.team_id,
           name = EXCLUDED.name,
           "dateOfBirth" = EXCLUDED."dateOfBirth",
           position = EXCLUDED.position,
           "shirtNumber" = EXCLUDED."shirtNumber",
           nationality = EXCLUDED.nationality,
           "currentTeam" = EXCLUDED."currentTeam"`,
        [
          player.id,
          data.id,
          player.name,
          player.dateOfBirth,
          player.position,
          player.shirtNumber,
          player.nationality,
          player.currentTeam
        ]
      );
    }

    res.json({ status: "Arsenal team and players updated" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Update failed", details: String(e) });
  }
});

app.get("/api/arsenal", async (req, res) => {
  const team = await pool.query("SELECT * FROM teams WHERE id = 57");
  res.json(team.rows[0] || null);
});

app.get("/api/arsenal/players", async (req, res) => {
  const players = await pool.query(
    `SELECT name, "dateOfBirth", position, "shirtNumber", nationality, "currentTeam"
     FROM players
     WHERE team_id = 57
     ORDER BY "shirtNumber" NULLS LAST, name`
  );
  res.json(players.rows);
});

app.listen(3000, () => console.log("Server running: http://localhost:3000"));