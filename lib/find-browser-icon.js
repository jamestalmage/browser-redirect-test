var fs = require('fs');
var path = require('path');
var useragent = require('useragent');
var debug = require('debug')('find-browser-icon');
useragent(true);

var DEFAULT_IMAGE = path.resolve(__dirname, '../images/android_32x32.png');

module.exports = pickName;
module.exports.DEFAULT = DEFAULT_IMAGE;

var fileList = fs.readdirSync(path.resolve(__dirname, '../images'))
  .map(function(name) {
    var parts = name.toLowerCase().replace(/_32x32.png$/,'').split(/[\s_-]/);
    if (parts.indexOf('android') !== -1) {
      parts.push('mobile');
    }
    return {
      path: path.resolve(__dirname, '../images', name),
      name: parts.join('-'),
      parts: parts
    };
  });

function pickName (agent) {
  if ('string' === typeof agent) {
    agent = useragent.lookup(agent);
  }
  var agentFamily = agent.family.toLowerCase().split(/[\s_-]/);

  debug('***** Checking:  %s *****', agent.family);

  var osFamily = agent.os && agent.os.family && agent.os.family.toLowerCase().split(/[\s_-]/);
  var deviceFamily = agent.device && agent.device.family && agent.device.family.toLowerCase().split(/[\s_-]/);

  var mostMatches = 0;
  var shortestLength = -1;
  var chosen = null;

  fileList.forEach(function(fileInfo) {
    if (fileInfo.parts[0] !== agentFamily[0]) return;
    if (chosen) {
      debug('comparing %s to %s' , fileInfo.name, chosen.name);
    }

    function reduce(found, matchPart){
      return found + (fileInfo.parts.indexOf(matchPart) === -1 ? 0 : 1)
    }

    var matches = agentFamily.reduce(reduce, 0);
    if (osFamily) matches = osFamily.reduce(reduce, matches);
    if (deviceFamily) matches = deviceFamily.reduce(reduce, matches);
    if (chosen) debug('matches: %d, length: %d', matches, fileInfo.parts.length);

    if (matches > mostMatches || (matches === mostMatches && fileInfo.parts.length < shortestLength)) {
      if (chosen) {
        debug('picking %s over %s' , fileInfo.name, chosen.name);
      } else {
        debug('found %s', fileInfo.name);
        debug('matches: %d, length: %d', matches, fileInfo.parts.length);
      }
      mostMatches = matches;
      shortestLength = fileInfo.parts.length;
      chosen = fileInfo;
    }
  });

  if (chosen) {
    debug('chose %s', chosen.name);
  }
  return chosen;
}


