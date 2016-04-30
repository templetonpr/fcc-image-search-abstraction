"use strict";

let express = require('express');
let pg = require('pg');

// Express config
let app = express();
app.disable('x-powered-by');
app.use(express.static('public'));

// port
let port = process.env.PORT || 8080;

// database url
let conString = process.env.DATABASE_URL || "postgres://test:test@localhost/test_db";

// Some stuff to make Heroku's postgres implementation happy
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

app.get('/', (req, res) => {
  // return index page with instructions and frontend app
  res.sendFile('/public/index.html');
});

app.get('/search/:searchTerm', (req, res) => {
  let searchTerm = req.params.searchTerm;
  let offset = req.query.offset || 0;
  /*
  return {
    "url": image url,
    "alt": image alt text,
    "thumbnail": thumbnail url,
    "context": page url
  } for each result.

  - Return 10 at a time offset by ?offset=n
  */
  res.send("Searched for: '" + searchTerm + "'' with offset of: " + offset);
});

app.get('/latest', (req, res) => {
  // return { "term": search term, "when": time(UTC) } for each of last 10 image searches
  res.send("Latest searches");
});

app.listen(port, () => {
  console.log("Server is running on port " + port + "\n");
});
