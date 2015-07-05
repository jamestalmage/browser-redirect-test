var http = require('http');
var common = require('./common');
var Promise = require('bluebird');
var assert = require('assert');
var concat = require('concat-stream');

module.exports = runTest;

function runTest(recordData) {
  console.log('running test');
  assert.equal(typeof recordData, 'function', 'recordData')
  var p = Promise.resolve(true);

  common.HTTP_METHODS.forEach(function(method) {
    common.REDIRECT_CODES.forEach(function(code) {

      p = p.then(makeFirstRequest)
        .spread(createResponseData)
        .catch(createErrorData)
        .then(addCommonData)
        .then(recordData);

      function makeFirstRequest() {
        return new Promise(function(_resolve, reject) {
          var opts = {
            method: method.toUpperCase(),
            protocol: window.location.protocol,
            hostname: window.location.hostname,
            path: '/first/' + code,
            port: parseInt(window.location.port, 10)
          };
          http.request(opts, concatJson).on('error', reject).end();

          function concatJson(res) {
            if (res.statusCode === 200) {
              res.pipe(concat(resolve)).on('error', reject);
            } else {
              resolve(null);
              res.on('data', function() {});
            }

            function resolve(string) {
              _resolve([res, string]);
            }
          }
        });
      }

      function createResponseData(res, string) {
        var data = {
          string: string,
          error: false,
          resultingCode: res.statusCode,
          secondRequest: false
        };

        if (string) {
          try {
            data.secondRequest = {
              method: JSON.parse(string).secondRequestMethod,
              code: res.statusCode
            };
          } catch (e) {}
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

  return p;
}
