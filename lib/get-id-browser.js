var http = require('http');
var Promise = require('bluebird');
var concat = require('concat-stream');
var makeOpts = require('./make-opts-browser');
var assert = require('assert');

module.exports = function() {
  return fetchId().then(parseResult);
};

function fetchId() {
  return new Promise(function(resolve, reject) {
    http.request(makeOpts('get', '/getId'),function(res) {
      res.pipe(concat(resolve)).on('error', reject)
    }).on('error', reject).end();
  });
}

function parseResult(str) {
  return parseInt(str, 10);
}