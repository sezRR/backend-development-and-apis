require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
var bodyParser = require('body-parser')
const dns = require('dns');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

let url_links = []
let short_url_index = 0

app.use(bodyParser.urlencoded({ extended: true }))
app.post("/api/shorturl", (req, res) => {
  let url = new URL(req.body.url)

  dns.lookup(url.hostname, (err, address, family) => {
    if (err || !["http:", "https:"].includes(url.protocol)) return res.json({ error: "invalid URL" })

    let url_link_object = null
    for (var i = 0; i < url_links.length; i++) {
      if (url_links[i].original_url === req.body.url) {
        url_link_object = url_links[i]
        break
      }
    }

    if (url_link_object === null) {
      let new_url_link = {
        original_url: req.body.url,
        short_url: ++short_url_index
      }

      url_links.push(new_url_link)
      url_link_object = new_url_link
    }

    return res.json({
      original_url: url_link_object.original_url,
      short_url: url_link_object.short_url
    })
  })
})

app.get("/api/shorturl/:shorturlid", (req, res) => {

  const urlId = parseInt(req.params.shorturlid)

  if (isNaN(urlId)) return res.json({
    error: "Wrong format"
  })

  let url_link_object_short_url = null
  for (var i = 0; i < url_links.length; i++) {
    if (url_links[i].short_url === urlId) {
      console.log(url_links[i])
      url_link_object_short_url = url_links[i].original_url
      break
    }
  }

  if (url_link_object_short_url !== null) {
    res.redirect(url_link_object_short_url)
  } else {
    return res.json({
      error: "No short URL found for the given input"
    })
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
