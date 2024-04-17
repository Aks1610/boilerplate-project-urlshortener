'use strict';

const express = require('express');
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var mongoose = require('mongoose');
var shortId = require('shortid');
var bodyParser = require('body-parser');
var validUrl = require('valid-url');
require('dotenv').config();
const cors = require('cors');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({
  extended: false
}))
app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URI;
//console.log(uri);

mongoose.connect(uri, {
  serverSelectionTimeoutMS: 5000
});

const connection = mongoose.connection;

connection.once('open', () => {
  console.log("MongoDB connection established successfully");
})

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

//Create Schema

const Schema = mongoose.Schema;
const urlSchema = new Schema({
  original_url: String,
  short_url: String
})

const URL = mongoose.model("URL", urlSchema);

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl/', async function (req, res) {
  var url = req.body.url;
  const urlCode = shortId.generate();

  console.log(url);

  //Check for valid url
  if (!validUrl.isWebUri(url)) {
    res.status(401).json({
      error: "invalid URL"
    })
  } else {
    try {
      //check DB for existing url
      let findOne = await URL.findOne({
        original_url: url
      })
      if (findOne) {
        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url
        })
      } else {
        //if not found the create new and return
        findOne = new URL({
          original_url: url,
          short_url: urlCode
        })
        await findOne.save()
        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url
        })
      }
    } catch (err) {
      console.error(err);
      res.status(500).json('Server error....')
    }
  }
})

app.get('/api/shorturl/:short_url?', async function (req, res) {
  try{
    const urlParams = await URL.findOne({
      short_url: req.params.short_url
    })
    if (urlParams) {
      return res.redirect(urlParams.original_url);
    } else {
      return res.status(404).json('Server error');
    }
  } catch (err) {
    console.log(err);
    res.status(500).json('Server error')
  }
})

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
