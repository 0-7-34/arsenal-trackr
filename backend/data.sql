CREATE TABLE teams (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  season TEXT,
  logo TEXT,
  league TEXT,
  country TEXT,
  wins INTEGER,
  losses INTEGER,
  draws INTEGER,
  formation TEXT
);

CREATE TABLE players (
  id INTEGER PRIMARY KEY,
  teamid INTEGER,
  name TEXT NOT NULL,
  age INTEGER,
  nationality TEXT,
  height TEXT,
  "weight" TEXT,
  photo TEXT,
  team TEXT,
  appearances INTEGER,
  "minutes" INTEGER,
  position TEXT,
  rating FLOAT,
  shirtnumber INTEGER,
  goals INTEGER,
  passes INTEGER,
  tackles INTEGER,
  dribbles INTEGER,
  fouls INTEGER,
  cards INTEGER
);