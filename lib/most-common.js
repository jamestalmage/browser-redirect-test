module.exports = mostCommon;

var forEach = require('foreach');
var F = require('most-frequent');

function mostCommon (allAgents) {
  var method = [new F, new F, new F, new F, new F, new F];
  var path = [new F, new F, new F, new F, new F, new F];
  var code = new F();
  var body = new F();
  var length = new F();

  forEach(allAgents, function (agentData) {
    var len = 0;
    for(var i = 0; i < 6; i++) {
      var record = recordAtPosition(agentData, i);
      if (record) {
        len = i + 1;
      }
      method[i].add(record ? record.method : 'NA');
      path[i].add(record ? record.path : 'NA');
    }
    length.add(len);
    code.add(agentData.browserResult.code);
    body.add(String(agentData.browserResult.body));
  }, this);

  var flattened = {};

  forEach(allAgents, function(agentData, key) {
    var r = flattened[key] = {
      code: {
        value: agentData.browserResult.code,
        common: code.most(agentData.browserResult.code)
      },
      body: {
        value: agentData.browserResult.body,
        common: body.most(String(agentData.browserResult.body))
      },
      method: [],
      path: []
    };

    var len = 0;
    for (var i = 0; i < 6; i++) {
      var record = recordAtPosition(agentData, i);
      if (record) {
        len = i + 1;
      }
      if (record) {
        r.path[i] = {
          value: record.path,
          common: path[i].most(record.path)
        };
        r.method[i] = {
          value: record.method,
          common: method[i].most(record.method)
        };
      }
    }

    r.length = {
      value: len,
      common: length.most(len)
    };
  });

  return {
    method: method,
    path:path,
    code:code,
    body:body,
    flattened: flattened
  };
}

function usesCache(agentData) {
  var firstRecord = serverLogAtPosition(agentData, 0);
  return !(firstRecord && firstRecord.path === '/first');
}

function serverLogAtPosition(agentData, position) {
  return agentData.serverLog && agentData.serverLog.length > position && agentData.serverLog[position];
}

function recordAtPosition(agentData, position) {
  if (usesCache(agentData)) {
    if (position === 0) {
      return {method: "Cache", path: '/first'};
    }
    position--;
  }
  return serverLogAtPosition(agentData, position);
}