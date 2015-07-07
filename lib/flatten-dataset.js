module.exports = flattenAgentData;
var forEach = require('foreach');
var assert = require('assert');

function flattenAgentData(agentData) {
  var serverLogs = agentData.serverLogs;
  var flattened = {};
  twoLevelForEach(agentData.browserLogs, function(browserResult, method, code) {
    var fMethod = flattened[method] || (flattened[method] = {});
    fMethod[code] = {
      agent: agentData.agent,
      agentString: agentData.agentString,
      serverLog: serverLogs[method][code],
      browserResult: {
        body: browserResult.body === "Redirect Message" ? "Redirect Message" : "Response",
        code: browserResult.resultingCode
      }
    }
  });
  return flattened;
}

function flattenAggregateData(aggregateData) {
  var aggFlattened = {};
  forEach(aggregateData, function(agentData, agentNickname) {
    var fl = agentData.flattened || flattenAgentData(agentData);
    twoLevelForEach(fl, function(fb, method, code) {
      var perMethod = aggFlattened[method] || (aggFlattened[method] = {});
      var perCode = perMethod[code] || (perMethod[code] = {});
      perCode[agentNickname] = fb;
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
  flatten : flattenAgentData,
  flattenAggregateData: flattenAggregateData,
  pivot: pivot,
  twoLevelForEach: twoLevelForEach
};