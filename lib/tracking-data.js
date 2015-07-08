var Promise = require('bluebird');

module.exports = createTracker;

function createTracker(){
  var trackingData = [];
  var zeroIndex = new Date().getTime();

  var combinedData = {};

  function createTrackingData() {
    var data = {
      id: zeroIndex + trackingData.length,
      started: false,
      resultDefer: {},
      requestLogs: {}
    };

    data.result = new Promise(function(resolve, reject) {
      data.resultDefer.resolve = resolve;
      data.resultDefer.reject = reject;
    });

    data.result.then(function(data) {
      combinedData[data.agentNickname] = data;
    });

    trackingData.push(data);
    return data;
  }

  function trackingParam(req, res, next, trackingId) {
    var tracking = trackingData[trackingId - zeroIndex];
    if (tracking) {
      req.tracking = tracking;
      next();
    } else {
      next(new Error ('tracking data not found'));
    }
  }

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

  return {
    createTrackingData: createTrackingData,
    trackingParam: trackingParam,
    started: started,
    notComplete: notComplete,
    matchingAgent: matchingAgent,
    trackRequest: trackRequest,
    combinedData: combinedData
  }
}