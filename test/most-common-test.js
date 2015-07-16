'use strict';
describe('most-common', function() {
  var mostCommon = require('../lib/most-common');
  var assert = require('assert');

  function agent(code, body, var_logs) {
    var agent = {
      browserResult:{
        code: code || 200,
        body: body || 'Result Body'
      }
    };
    for (var i = 2; i < arguments.length; i ++) {
      (agent.serverLog || (agent.serverLog = [])).push(arguments[i]);
    }
    return agent;
  }

  function sl(method, path) {
    return {
      method: method || 'GET',
      path: path || '/first'
    };
  }

  it('keeps track of the count', function() {
    var mc = mostCommon({
      'agent1': agent(null, null),
      'agent2': agent(null, null, sl('GET', '/second')),
      'agent3': agent(null, null, sl('GET', '/second')),
      'agent4': agent(null, null, sl('GET', '/first'), sl('GET', '/second'))
    });

    assert(mc.code.most(200));
    assert(!mc.code.most(400));
    assert.strictEqual(mc.method[0].count('Cache'), 3);
    assert.strictEqual(mc.path[0].count('/first'), 4);

    assert.strictEqual(mc.method[0].count('GET'), 1);
    assert.strictEqual(mc.method[1].count('GET'), 3);
    assert.strictEqual(mc.path[1].count('/second'), 3, 'path[1].count(/second)');
    assert.strictEqual(mc.path[1].count('NA'), 1, 'path[1].count(NA)');

    assert.deepEqual(mc.flattened.agent1, {
      body: {
        value: 'Result Body',
        common: true
      },
      code: {
        value: 200,
        common: true
      },
      path: [
        {
            value: '/first',
            common: true
        }
      ],
      method: [
        {
          value: 'Cache',
          common: true
        }
      ],
      length: {
        value: 1,
        common: false
      }
    });

    assert.deepEqual(mc.flattened.agent2, {
      body: {
        value: 'Result Body',
        common: true
      },
      code: {
        value: 200,
        common: true
      },
      path: [
        {
          value: '/first',
          common: true
        },
        {
          value: '/second',
          common: true
        }
      ],
      method: [
        {
          value: 'Cache',
          common: true
        },
        {
          value: 'GET',
          common: true
        }
      ],
      length: {
        value: 2,
        common: true
      }
    });
  });
});