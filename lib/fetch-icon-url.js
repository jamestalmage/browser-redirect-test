var concat = require('./concat-request');
var makeOpts=  require('./make-opts-browser');
var Promise = require('bluebird');

module.exports = fetchUrl;

var cache = {};
var fetching = {};

/**
 *
 * @param agentString
 * @param cb
 * @returns {*} null if no result yet (fetch will be triggered), false if negative result (not found).
 */
function fetchUrl(agentString, cb) {
  if (cache.hasOwnProperty(agentString)) {
    fetching[agentString].nodeify(cb);
    return cache[agentString];
  }

  if (!fetching[agentString]) {
    fetching[agentString] = concat.get(makeOpts('/iconUrl/' + encodeURIComponent(agentString)))
      .then(function(res) {
        if (res.statusCode === 200) {
          return res.json || res.body;
        } else {
          return false;
        }
      }).then(function(res){
        cache[agentString] = res;
        throw new Error('not found');
      });
  }
  fetching[agentString].nodeify(cb);
  return null;
}
