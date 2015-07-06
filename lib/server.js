var http = require('http');
var express = require('express');
var common = require('./common');
var path = require('path');

function setup(port)  {

  var app = express();

  var id = 0;

  app.get('/getId', function(req, res) {
    res.send('' + id);
    id++;
  });

  app.use(express.static(path.join(__dirname, '..')));

  common.HTTP_METHODS.forEach(setUpMethod);

  function setUpMethod(method) {
    app[method]('/:id/first/:code', function(req, res) {
      var code = parseInt(req.params.code, 10);
      var id = parseInt(req.params.id, 10);
      res.redirect(code, '/' + id +'/second/' + method + '/' + code);
    });

    app[method]('/:id/second/:method/:code', function(req, res) {
      res.json({
        secondRequestMethod: method
      });
    });
  }

  http.createServer(app).listen(3000);
}

setup();