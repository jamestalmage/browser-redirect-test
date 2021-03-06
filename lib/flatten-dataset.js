module.exports = flattenAgentData;
var forEach = require('foreach');
var twoLevelForEach = require('./two-level-for-each');

function _flattenAgentData(agentData, run) {
  var serverLogs = agentData.serverLogs[run];
  var flattened = {};
  twoLevelForEach(agentData.browserLogs[run], function(browserResult, method, code) {
    var fMethod = flattened[method] || (flattened[method] = {});
    var body;
    if (browserResult.error) {
      body = browserResult.error;
    } else {
      body = browserResult.body;
      if (typeof body === 'string') {
        try {
          var temp = JSON.parse(body);
          if (temp.secondRequestMethod) {
            body = 'Result Body';
          }
        } catch (e) {}
      }
    }

    if (!serverLogs[method]) console.log('no server logs for ', method);
    fMethod[code] = {
      agent: agentData.agent,
      agentNickname: agentData.agentNickname,
      agentString: agentData.agentString,
      serverLog: serverLogs[method] && serverLogs[method][code],
      browserResult: {
        body: body,
        code: browserResult.resultingCode
      }
    }
  });
  return flattened;
}

function flattenAgentData(agentData) {
  return {
    firstRun: _flattenAgentData(agentData,'firstRun'),
    secondRun: _flattenAgentData(agentData, 'secondRun')
  };
}

function _flattenAggregateData(aggregateData, run) {
  var aggFlattened = {};
  forEach(aggregateData, function(agentData, agentNickname) {
    var fl = flattenAgentData(agentData);
    twoLevelForEach(fl[run], function(fb, method, code) {
      var perMethod = aggFlattened[method] || (aggFlattened[method] = {});
      var perCode = perMethod[code] || (perMethod[code] = {});
      perCode[agentNickname] = fb;
    });
  });
  return aggFlattened;
}

function flattenAggregateData(aggregateData) {
  return {
    firstRun: _flattenAggregateData(aggregateData,'firstRun'),
    secondRun: _flattenAggregateData(aggregateData, 'secondRun')
  };
}

function pivot(dat) {
  var pivoted = {};
  twoLevelForEach(dat, function(pd, i1, i2) {
    var pi2 = pivoted[i2] || (pivoted[i2] = {});
    pi2[i1] = pd;
  });
  return pivoted;
}

module.exports = {
  flatten : flattenAgentData,
  flattenAggregateData: flattenAggregateData,
  pivot: pivot
};