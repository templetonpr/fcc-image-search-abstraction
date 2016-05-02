"use strict";

let pg      = require('pg');
let morgan  = require('morgan');
let express = require('express');

// Express config
let app = express();
app.disable('x-powered-by');
app.use(express.static('public'));
app.use(morgan('short'));

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

  pg.connect(conString, (err, client, done) => {
    if (handleDbError(err)) return; // handle error from the connection

    client.query('INSERT INTO image_searches (search_term, timestamp) VALUES ($1, $2)', [searchTerm, Date.now().toString()], (err, result) => {
      if (handleDbError(err)) return; // handle error from the query
      done();

      res.send("Searched for: '" + searchTerm + "'' with offset of: " + offset);
    });
  });
});

app.get('/latest', (req, res) => {
  // return { "term": search term, "when": timestamp } for each of last 10 image searches

  pg.connect(conString, (err, client, done) => {
    if (handleDbError(err)) return; // handle error from the connection

    client.query('SELECT * FROM image_searches ORDER BY p_id DESC LIMIT 10', (err, result) => {
      if (handleDbError(err)) return; // handle error from the query
      done();

      let rows = [];
      for (let i = 0; i < result.rows.length; i++) {
        rows.push({
          "term": result.rows[i].search_term,
          "when": result.rows[i].timestamp
        });
      }
      res.json(rows);
    });
  });
});

app.listen(port, () => {
  console.log("Server is running on port " + port + "\n");
});

let handleDbError = (err, client, res) => {
  if (!err) {
    return false; // no error, continue with the request
  } else if (client) done(client); // remove client from connection pool
  console.error(err);
  res.status(500).json({error: "Internal server error. Please try again in a moment."});
  return true;
};
