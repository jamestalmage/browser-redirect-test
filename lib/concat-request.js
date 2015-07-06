var http = require('http');
var concat= require('concat-stream');
var Promise = require('bluebird');

module.exports = {
  request: request,
  get: get
};

function request(opts) {
  var req;
  var promise = new Promise(function(resolve, reject) {
    req = http.request(opts, function(res) {
      res.pipe(concat(function(body){
        res.body = body;
        try {
          res.json = JSON.parse(body);
        } catch (e) {}
        resolve(res);
      })).on('error', reject);
    });
    req.on('error', reject);
  });
  promise.req = req;
  return promise;
}

function get(opts) {
  opts.method = 'GET';
  var p = request(opts);
  p.req.end();
  return p;
}

