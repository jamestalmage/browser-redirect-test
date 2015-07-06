var http = require('http');
var express = require('express');
var common = require('./common');
var path = require('path');
var bodyParser = require('body-parser');

function setup(port)  {

  var app = express();

  var trackingData = [];

  function createTrackingId() {
    var id = trackingData.length;
    trackingData.push({
      id: id,
      started: false
    });
    return id;
  }

  app.use(express.static(path.join(__dirname, '..')));

  app.param('id', function(req, res, next, id) {
    var tracking = trackingData[id];
    if (tracking) {
      req.tracking = tracking;
      next();
    } else {
      next(new Error ('tracking data not found'));
    }
  });

  function started(req, res, next) {
    if (!req.tracking.started) {
      return next(new Error('tracking not started'));
    } else {
      return next();
    }
  }

  function notComplete(req, res, next) {
    if (req.tracking.complete) {
      return next(new Error('tracking already complete'));
    } else {
      return next();
    }
  }

  app.use('/tracking/:id', started, notComplete);

  app.get('/getId', function(req, res) {
    res.json({id: createTrackingId()});
  });

  app.post('/start/:id', function(req, res) {
    if (req.tracking.started) {
      res.status(400).send('already started!');
    } else {
      req.tracking.started = true;
      res.send('OK');
    }
  });

  app.post('/tracking/:id/end', bodyParser.json(), function(req, res) {
    req.tracking.complete = true;
    res.send('OK');
  });

  common.HTTP_METHODS.forEach(setUpMethod);

  function setUpMethod(method) {
    app[method]('/tracking/:id/first/:code', function(req, res) {
      var code = parseInt(req.params.code, 10);
      var id = req.tracking.id;
      res.redirect(code, '/tracking/' + id +'/second/' + method + '/' + code);
    });

    app[method]('/tracking/:id/second/:method/:code', function(req, res) {
      res.json({
        secondRequestMethod: method
      });
    });
  }

  http.createServer(app).listen(3000);
}

setup();