var http = require('http');
var Promise = require('bluebird');
var concat = require('./concat-request');
var makeOpts = require('./make-opts-browser');
var assert = require('assert');

module.exports = function() {
  return fetchId().then(parseResult);
};

function fetchId() {
  return concat.get(makeOpts('get', '/getId'));
}

function parseResult(res) {
  assert.equal(200, res.statusCode, 'bad getId status code');
  assert.equal('number', typeof res.json.id, 'res.json.id is not a number');
  return res.json.id;
}