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

  var tracker = require('./tracking-data')();

  app.use(express.static(path.join(__dirname, '..')));

  app.param('id', tracker.trackingParam);

  app.use('/tracking/:id', tracker.started, tracker.notComplete, tracker.matchingAgent);

  app.use('/tracking/:id/:method/:code', tracker.trackRequest);

  app.get('/getId', function(req, res) {
    res.json({id: tracker.createTrackingData().id});
  });

  app.get('/testData', function(req, res) {
     res.json(tracker.combinedData);
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
      browserLogs: req.body,
      serverLogs: req.tracking.requestLogs
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
      res.status(code).send('Redirect Message');
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