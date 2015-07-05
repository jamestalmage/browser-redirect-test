var runTest = require('./run-test');
var common = require('./common');
var angular = require('angular');
var Promise = require('bluebird');

angular.module('browser-redirect-test', [])
  .controller('TestResultsController', [TestResultsController])
  .run(['$rootScope', setPromiseScheduler])
  .directive('resultCell',function(){
    return {
      restrict:'A',
      scope: {result:'='},
      templateUrl:'/cell.html'
    };
  });

function TestResultsController () {
  this.methods = common.HTTP_METHODS;
  this.codes = common.REDIRECT_CODES;
  var result = this.result = {};

  runTest(function logData(data) {
    var method = data.firstRequest.method;
    var code = data.firstRequest.code;

    (result[method] || (result[method] = {}))[code] = data;
  }).then(function(){
    console.log('all done!');
    console.log(result);
  });
}

function setPromiseScheduler ($rootScope){
  Promise.setScheduler(function(fn){
    $rootScope.$evalAsync(fn);
  });
}
