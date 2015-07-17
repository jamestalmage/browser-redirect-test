module.exports = twoLevelForEach;
var forEach = require('foreach');

function twoLevelForEach(data, cb) {
  forEach(data, function(data2, i) {
    forEach(data2, function(data3, j) {
      cb(data3, i, j)
    });
  });
}