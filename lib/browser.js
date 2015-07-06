var runTest = require('./run-test');
var common = require('./common');
var angular = require('angular');
var Promise = require('bluebird');

angular.module('browser-redirect-test', [])
  .controller('RunTestController', [RunTestController])
  .run(['$rootScope', setPromiseScheduler])
  .directive('resultCell', resultCellDirective)
  .directive('resultTable', resultTableDirective);

function resultCellDirective(){
  return {
    restrict:'A',
    scope: {result:'=resultCell'},
    templateUrl:'/cell.html'
  };
}

function resultTableDirective(){
  return {
    restrict:'A',
    replace:true,
    scope: {
      result:'=resultTable',
      methods:'=',
      codes:'='
    },
    templateUrl:'/table.html'
  };
}

function RunTestController () {
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
