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
      scope: {result:'=resultCell'},
      templateUrl:'/cell.html'
    };
  });

function TestResultsController () {
  this.methods = common.HTTP_METHODS;
  this.codes = common.REDIRECT_CODES;
  var p1 = runTest();
  this.result = p1.result;

  p1.then(function(result){
    console.log('all done!');
    console.log(result);
  });
}

function setPromiseScheduler ($rootScope){
  Promise.setScheduler(function(fn){
    $rootScope.$evalAsync(fn);
  });
}
