var http = require('http');
var express = require('express');
var common = require('./common');
var path = require('path');

function setup(port)  {

  var app = express();

  app.use(express.static(path.join(__dirname, '..')));

  common.HTTP_METHODS.forEach(setUpMethod);

  function setUpMethod(method) {
    app[method]('/first/:code', function(req, res) {
      var code = parseInt(req.params.code, 10);
      res.redirect(code, '/second/' + method + '/' + code);
    });

    app[method]('/second/:method/:code', function(req, res) {
      res.json({
        secondRequestMethod: method
      });
    });
  }

  http.createServer(app).listen(3000);
}

setup();