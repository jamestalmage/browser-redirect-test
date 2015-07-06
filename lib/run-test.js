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
  var result = {
    data: testData
  };
  var p1 = 'number' === typeof id ? Promise.resolve(id) : getId();
  p1 = p1.then(signalStart).then(makeRequests).return(testData);

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
      result.id = id;
      result.agent = res.json.agent
    }).return(id);
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
          var promise = concat.request(makeOpts(method,'/tracking/' + id + '/first/' + code));
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

    return allTestsComplete.then(function() {
      var opts = makeOpts('post', '/tracking/' + id + '/end');
      var body = JSON.stringify(testData);
      opts.headers = {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body)
      };
      var promise = concat.request(opts);
      promise.req.write(body);
      promise.req.end();
      return promise;
    });
  }
}
