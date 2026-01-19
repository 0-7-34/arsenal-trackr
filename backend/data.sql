CREATE TABLE teams (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  venue TEXT,
  founded INTEGER
);

CREATE TABLE players (
  id INTEGER PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id),
  name TEXT NOT NULL,
  "dateOfBirth" TEXT,
  position TEXT,
  "shirtNumber" INTEGER,
  nationality TEXT,
  "currentTeam" TEXT
);
