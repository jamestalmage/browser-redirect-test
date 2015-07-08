var http = require('http');
var express = require('express');
var common = require('./common');
var path = require('path');
var bodyParser = require('body-parser');
var Promise = require('bluebird');
var browserIcon = require('./find-browser-icon');
var fs = require('fs');
var useragent = require('useragent');
useragent(true);

function setup(port)  {

  var app = express();

  var tracker = require('./tracking-data')();

  app.use(express.static(path.join(__dirname, '..')));

  app.param('id', tracker.trackingParam);

  app.use('/tracking/:id', tracker.started, tracker.notComplete, tracker.matchingAgent);

  app.use('/tracking/:id/:method/:code', tracker.trackRequest);

  app.get('/getId', function(req, res) {
    var id = tracker.createTrackingData().id;
    res.status(200).json({id: id});
  });

  app.get('/testData', function(req, res) {
     res.status(200).json(tracker.combinedData);
  });

  app.get('/browser-icon', function(req, res) {
    var agent;
    if (req.query.browser) {
      agent = {family: req.query.browser}
    } else  {
      agent = req.query.agent || req.headers['user-agent'];
    }
    sendIcon(agent, res);
  });

  app.get('/browser-icon/:browser', function(req, res) {
    var agent = useragent.lookup(req.params.browser);
    if (/other/i.test(agent.family)) {
      agent = {family: req.params.browser}
    }
    sendIcon(agent, res);
  });

  function sendIcon(agent, res) {
    var fileinfo = browserIcon(agent);
    res.set('Content-Type', 'image/png');
    if (fileinfo) {
      fs.createReadStream(fileinfo.path).pipe(res.status(200));
    } else {
      fs.createReadStream(browserIcon.DEFAULT).pipe(res.status(400));
    }
  }

  app.post('/start/:id', function(req, res) {
    var tracking = req.tracking;
    if (tracking.started) {
      res.status(400).send('already started!');
    } else {
      tracking.started = true;
      tracking.agentString = req.headers['user-agent'];
      tracking.agent = useragent.parse(tracking.agentString);
      tracking.agentNickname = tracking.agent.toString();
      res.json({
        agentNickname:tracking.agentNickname
      });
    }
  });

  app.post('/tracking/:id/mark', function(req, res){
    req.tracking.firstRunLogs = req.tracking.requestLogs;
    req.tracking.requestLogs = {};
    res.send("OK");
  });

  app.post('/tracking/:id/end', bodyParser.json(), function(req, res) {
    req.tracking.complete = true;
    req.tracking.resultDefer.resolve({
      agent: req.tracking.agent.toJSON(),
      agentNickname: req.tracking.agentNickname,
      agentString: req.tracking.agentString,
      browserLogs: req.body,
      serverLogs: {
        firstRun: req.tracking.firstRunLogs,
        secondRun: req.tracking.requestLogs
      }
    });
    res.send('OK');
  });

  common.HTTP_METHODS.forEach(setUpMethod);

  function setUpMethod(method) {
    app[method]('/tracking/:id/:method/:code/first', function(req, res) {
      var code = parseInt(req.params.code, 10);
      var trackingMethod = req.params.method;
      var id = req.params.id;
      res.set('Location', '/tracking/' + id + '/' + trackingMethod + '/' + code + '/second');
      res.status(code).send('Redirect Message Body');
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