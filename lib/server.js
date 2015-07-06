var http = require('http');
var express = require('express');
var common = require('./common');
var path = require('path');
var bodyParser = require('body-parser');
var useragent = require('useragent');
var Promise = require('bluebird');
useragent(true);

function setup(port)  {

  var app = express();

  var trackingData = [];

  var combinedData = {};

  function createTrackingData() {
    var data = {
      id: trackingData.length,
      started: false,
      resultDefer: {},
      requestLogs: {}
    };

    data.result = new Promise(function(resolve, reject) {
      data.resultDefer.resolve = resolve;
      data.resultDefer.reject = reject;
    });

    data.result.then(function(data) {
      combinedData[data.agent] = data;
    });

    trackingData.push(data);
    return data;
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
      var error = new Error('tracking not started');
      req.tracking.resultDefer.reject(error);
      return next(error);
    } else {
      return next();
    }
  }

  function notComplete(req, res, next) {
    if (req.tracking.complete) {
      var error = new Error('tracking already complete');
      req.tracking.resultDefer.reject(error);
      return next(error);
    } else {
      return next();
    }
  }

  function matchingAgent(req, res, next) {
    if (req.headers['user-agent'] !== req.tracking.agentString) {
      var error = new Error('user-agent mismatch');
      req.tracking.resultDefer.reject(error);
      return next(error);
    } else {
      return next();
    }
  }

  function trackRequest(req, res, next) {
    var requestLogs = req.tracking.requestLogs;

    var trackingMethod = req.params.method;
    var trackingCode = req.params.code;

    var requestLog = requestLogs[trackingMethod] || (requestLogs[trackingMethod] = {});
    requestLog = requestLog[trackingCode] || (requestLog[trackingCode] = []);

    requestLog.push({
      method: req.method,
      path: req.path
    });
    next();
  }

  app.use('/tracking/:id', started, notComplete, matchingAgent);

  app.use('/tracking/:id/:method/:code', trackRequest);

  app.get('/getId', function(req, res) {
    res.json({id: createTrackingData().id});
  });

  app.get('/testData', function(req, res) {
     res.json(combinedData);
  });

  app.post('/start/:id', function(req, res) {
    var tracking = req.tracking;
    if (tracking.started) {
      res.status(400).send('already started!');
    } else {
      tracking.started = true;
      tracking.agentString = req.headers['user-agent'];
      tracking.agent = useragent.parse(tracking.agentString);
      res.json({
        agent:tracking.agent.toString()
      });
    }
  });

  app.post('/tracking/:id/end', bodyParser.json(), function(req, res) {
    req.tracking.complete = true;
    req.tracking.resultDefer.resolve({
      agent: req.tracking.agent.toString(),
      agentString: req.tracking.agentString,
      data: req.body,
      requestLogs: req.tracking.requestLogs
    });
    res.send('OK');
  });

  common.HTTP_METHODS.forEach(setUpMethod);

  function setUpMethod(method) {
    app[method]('/tracking/:id/:method/:code/first', function(req, res) {
      var code = parseInt(req.params.code, 10);
      var trackingMethod = req.params.method;
      var id = req.params.id;
      res.redirect(code, '/tracking/' + id + '/' + trackingMethod + '/' + code + '/second');
    });

    app[method]('/tracking/:id/:method/:code/second', function(req, res) {
      res.json({
        secondRequestMethod: method
      });
    });
  }

  http.createServer(app).listen(3000);
}

setup();