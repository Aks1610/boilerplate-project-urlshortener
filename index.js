require('dotenv').config();
const express = require('express');
const validUrl = require('valid-url');
const cors = require('cors');
const app = express();
const dns = require('dns');
const bodyParser = require('body-parser');
const validator = require("validator");

// Basic Configuration
const port = process.env.PORT || 3000;
app.use(express.json()); // Parse JSON in the request body
app.use(bodyParser.urlencoded({extented: true}));
app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));
let urlMapping = {};
let counter = 0;
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

function validateUrl(req, res, next) {
  // const url = req.body && req.body.url;
  const { url } = req.body;

  validate(url,req, res, next);
}

function validate(url, req, res, next) {
  if (!url || !validUrl.isWebUri(url)) {
    return res.json({ error: 'invalid url' });
  }

  // Create a new variable to store the validated URL
  const validatedUrl = new URL(url);

  const httpRegex = /^(https)(:\/\/)/;
  if (!httpRegex.test(url)) {return res.json({ error: 'invalid url' })}


    dns.lookup(validatedUrl.hostname, (err, addresses) => {
     if(!addresses) {
        return res.send({ error: 'invalid url' });
      }
    next();
  });
} 
// Your first API endpoint
app.post('/api/shorturl',
 validateUrl,
 function(req, res) {
  const url = req.body.url;
  const shortUrl = ++counter; // Increment counter for each new URL  
  urlMapping[counter] = url;  
  res.json({ original_url: url, short_url: shortUrl });
});

app.get('/api/shorturl/:shorturl',
  function(req, res) {
    const id = parseInt(req.params.shorturl);
    const url = urlMapping[id]
    if (url) {
      validate(url,req, res, ()=> {
         res.redirect(urlMapping[id])
      });
    } else {
      res.json({error: 'Short URL not found'})
    }
 });
 
app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
