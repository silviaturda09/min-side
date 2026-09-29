-- Oppgave 5: databasen din.
--
-- Én tabell holder. Kravene:
CREATE TABLE film(
    id INTEGER PRIMARY KEY,
    title TEXT,
    year INTEGER,
    genre TEXT,
    dice_score INTEGER,
    review TEXT
);

INSERT INTO film(title, year, genre, dice_score, review)
VALUES ('Fight Club', 1999, 'Action', 6, 'A film with a big plot twist'),
('Titanic', 1997, 'Romance', 5, 'A classic film, but very famous'),
('Scarface', 1983, 'Crime Drama', 6, 'A great old film'),
('The Matrix', 1999, 'Sci-Fi', 5, 'Full of suspense film'),
('8 Mile', 2002, 'Drama', 6, 'Very exciting film')
--   * en id som primærnøkkel:   id INTEGER PRIMARY KEY
--   * minst 5 kolonner i tillegg til id
--   * minst 5 rader med data
--   * tabellnavnet uten æ, ø og å. Navnet blir også en adresse,
--     /api/<tabellnavn>, og Express finner ikke adresser med æøå.
--
-- Bygg databasen:   npm run reset-db
-- Sjekk den:        npm run database
--
-- Lager du flere tabeller, regner testene den med flest kolonner som
-- hovedtabellen – den som skal vises på sida.

