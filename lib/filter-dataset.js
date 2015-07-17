module.exports = filterDataset;

var forEach = require('foreach');
var twoLevelForEach = require('./two-level-for-each');

function _filterDataset(aggFlattened, filter) {
  var result = {};

  twoLevelForEach(aggFlattened, function(_perCode, method, code) {
    var perMethod = result[method] || (result[method] = {});
    var perCode = perMethod[code] || (perMethod[code] = {});
    var comparison;
    var allTheSame = true;
    forEach(_perCode, function(agentData, agentNickname) {
      if (filter(agentNickname, agentData)) {
        perCode[agentNickname] = agentData;
        if (comparison) {
          allTheSame = allTheSame
            && angular.equals(agentData.serverLog, comparison.serverLog)
            && angular.equals(agentData.browserResult, comparison.browserResult);
        } else {
          comparison = agentData;
        }
      }
    });
    Object.defineProperty(perCode,'$allTheSame', {value: !!allTheSame});
  });

  return result;
}

function filterDataset(aggFlattened, firstRunFilter, secondRunFilter) {
  secondRunFilter = secondRunFilter || firstRunFilter;
  return {
    firstRun: _filterDataset(aggFlattened.firstRun, firstRunFilter, 'firstRun'),
    secondRun: _filterDataset(aggFlattened.secondRun, secondRunFilter, 'secondRun')
  }
}