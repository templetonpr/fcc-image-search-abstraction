"use strict";

let pg = require('pg');
let conString = process.env.DATABASE_URL || "postgres://test:test@localhost/test_db";

if (process.env.ON_HEROKU) {
  pg.defaults.ssl = true;
  pg.connect(process.env.DATABASE_URL, function(err, client) {
    if (err) throw err;
    console.log('Connected to postgres! Getting schemas...');

    client
      .query('SELECT table_schema,table_name FROM information_schema.tables;')
      .on('row', function(row) {
        console.log(JSON.stringify(row));
      });
  });
}

let client = new pg.Client(conString);

console.log("Dropping table and recreating...");

client.connect( (err) => {
  if (err) return console.error('Could not connect to postgres', err);
  client.query(
    "DROP TABLE IF EXISTS image_searches;" +
    "CREATE TABLE image_searches (" +
    "p_id SERIAL PRIMARY KEY," +
    "search_term TEXT NOT NULL," +
    "timestamp CHAR(13) NOT NULL);", (err, result) => {
    if (err) return console.error('Error running query', err);
    client.end();
  });
});