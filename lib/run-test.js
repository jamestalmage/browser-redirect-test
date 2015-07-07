var http = require('http');
var common = require('./common');
var Promise = require('bluebird');
var assert = require('assert');
var concat = require('./concat-request');
var makeOpts = require('./make-opts-browser');
var getId = require('./get-id-browser');

module.exports = runTest;

function runTest(id) {
  var testData = {};
  var _id_;
  var result = {
    data: testData,
    firstRun: testData,
    secondRun: {}
  };
  var p1 = ('number' === typeof id ? Promise.resolve(id) : getId())
    .then(signalStart)
    .then(makeRequests)
    .then(markSecondRun)
    .then(makeRequests)
    .then(signalEnd)
    .return(testData);

  // stick the eventual result on the return value so angular can
  // update the display as each result comes in
  p1.result = result;
  return p1;

  function signalStart(id) {
    assert.equal(typeof id, 'number', id);
    var startPromise = concat.request(makeOpts('post', '/start/' + id));
    startPromise.req.end();
    return startPromise.then(function(res) {
      assert.equal(res.statusCode, 200, 'server denied start');
      result.id = _id_ = id;
      result.agent = res.json.agent
    }).return(id);
  }

  function markSecondRun() {
    var markPromise = concat.request(makeOpts('post', '/tracking/' + _id_ + '/mark'));
    markPromise.req.end();
    return markPromise.then(function(res) {
      assert.equal(res.statusCode, 200, 'server denied mark');
      testData = result.data = result.secondRun
    }).return(_id_);
  }

  function makeRequests(id) {
    assert.equal(typeof id, 'number', id);
    var allTestsComplete = Promise.resolve(true);

    common.HTTP_METHODS.forEach(function(method) {
      common.REDIRECT_CODES.forEach(function(code) {

        allTestsComplete = allTestsComplete.then(makeFirstRequest)
          .then(createResponseData)
          .catch(createErrorData)
          .then(addCommonData)
          .then(recordData);

        function makeFirstRequest() {
          var promise = concat.request(makeOpts(method,'/tracking/' + id + '/' + method + '/' + code + '/first'));
          promise.req.end();
          return promise;
        }

        function createResponseData(res) {
          var data = {
            body: res.body,
            error: false,
            resultingCode: res.statusCode,
            secondRequest: false
          };

          if (res.json && 200 === res.statusCode) {
            data.secondRequest = {
              method: res.json.secondRequestMethod,
              code: res.statusCode
            };
          } else {
            assert.equal(code, res.statusCode);
          }

          return data;
        }

        function createErrorData(err) {
          return {
            error: '' + err
          };
        }

        function addCommonData(data) {
          data.firstRequest = {
            method: method,
            code: code
          };
          return data;
        }
      });
    });

    function recordData(data) {
      var method = data.firstRequest.method;
      var code = data.firstRequest.code;

      (testData[method] || (testData[method] = {}))[code] = data;
    }

    return allTestsComplete;
  }

  function signalEnd() {
    var opts = makeOpts('post', '/tracking/' + _id_ + '/end');
    var body = JSON.stringify({
      firstRun: result.firstRun,
      secondRun: result.secondRun
    });
    opts.headers = {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body)
    };
    var promise = concat.request(opts);
    promise.req.write(body);
    promise.req.end();
    return promise;
  }
}
