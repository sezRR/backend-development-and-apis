// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');
app.use(cors({optionsSuccessStatus: 200}));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});


// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.get("/api/:date", (req, res) => {

  let unixValue = null
  let utcValue = null

  const getParam = req.params.date

  if (isNaN(Date.parse(new Date(parseInt(getParam))))) {
    res.json({"error": "Invalid Date"})
  }

  if (getParam.search("-") > 0) {
    const splittedFullDate = getParam.split("-")

    let year = splittedFullDate[0]
    let month = splittedFullDate[1] - 1
    let day = splittedFullDate[2]

    unixValue = +new Date(year, month, day)
    utcValue = new Date(unixValue).toUTCString()
  } else if (getParam.search(" ") > 0) {
    unixValue = +new Date(getParam)
    utcValue = new Date(unixValue).toUTCString()
  } else {
    unixValue = parseInt(getParam)
    utcValue = new Date(unixValue).toUTCString()
  }

  res.json({unix: unixValue, utc: utcValue})
})

app.get("/api/", (req, res) => {
    unixValue = +new Date()
    utcValue = new Date(unixValue).toUTCString()

  res.json({unix: unixValue, utc: utcValue})
})

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
