var express = require('express');
var crypto = require('crypto');
var base62 = require('base-x')('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
var db = require('./db.js');

var app = express();

app.set('views', './views');
app.set('view engine', 'pug');

app.get('/new/:url(\\S+)', function(req, res) {
  
  var hash = crypto.createHash('md5').update(req.params.url);
  hash = base62.encode(hash.digest()).substr(0,6);
    
  var shorturls = db.get().collection("shorturls");
  shorturls.findOne({ hash: hash }, function(err, url) {
    var response = { short_url: req.protocol + '://' + req.get('host') + '/' + hash };
    if (err) {
      console.error(err);
    } else {
      if (!url) {
        var newUrl = {
          hash: hash,
          original: req.params.url
        };
        shorturls.insert(newUrl);
        response.original_url = req.params.url;
      } else {
        response.original_url = url.original;
      }
      res.send(response);
    }
  });
  
});

app.get("/:hash", function(req, res) {
  var url = db.get().collection("shorturls").findOne({hash: req.params.hash}, function(err, url) {
    if (err) {
      console.error(err);
    } else {
      if (url) {
        res.redirect(url.original);
      } else {
        res.status(404);
        res.send("Not found");
      }
    }
  });;
});

app.get('/', function (req, res) {
  res.render('index', { siteurl: req.protocol + '://' + req.get('host') });
});

db.connect(process.env.MONGOLAB_URI, function(err) {
  if (err) {
    console.log('Unable to connect to Mongo.');
    process.exit(1);
  } else {
    app.listen(process.env.PORT || 8080, function () {
      console.log('App listening');
    });
  }
});
