module.exports = flatten;
var forEach = require('foreach');
var assert = require('assert');

function flatten(agentData) {
  var serverLogs = agentData.serverLogs;
  var flattened = {};
  twoLevelForEach(agentData.browserLogs, function(browserResult, method, code) {
    var fMethod = flattened[method] || (flattened[method] = {});
    fMethod[code] = {
      serverLog: serverLogs[method][code],
      browserResult: {
        body: browserResult.body === "Redirect Message" ? "Redirect Message" : "Response",
        code: browserResult.code
      }
    }
  });
  return flattened;
}

function flattenBrowsers(aggData) {
  var aggFlattened = {};
  forEach(aggData, function(browserData, browserName) {
    var fl = browserData.flattened || flatten(browserData);
    twoLevelForEach(fl, function(fb, method, code) {
      var perMethod = aggFlattened[method] || (aggFlattened[method] = {});
      var perCode = perMethod[code] || (perMethod[code] = {});
      perCode[browserName] = fb;
    });
  });
  return aggFlattened;
}

function pivot(dat) {
  var pivoted = {};
  twoLevelForEach(dat, function(pd, i1, i2) {
    var pi2 = pivoted[i2] || (pivoted[i2] = {});
    pi2[i1] = pd;
  });
  return pivoted;
}

function twoLevelForEach(data, cb) {
  forEach(data, function(data2, i) {
    forEach(data2, function(data3, j) {
       cb(data3, i, j)
    });
  });
}

module.exports = {
  flatten : flatten,
  flattenBrowsers: flattenBrowsers,
  pivot: pivot,
  twoLevelForEach: twoLevelForEach
};