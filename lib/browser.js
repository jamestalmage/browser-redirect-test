var runTest = require('./run-test');
var common = require('./common');
var angular = require('angular');
var Promise = require('bluebird');
var assert = require('assert');

angular.module('browser-redirect-test', [])
  .run(['$rootScope', setPromiseScheduler])
  .controller('RunTestController', ['$location', '$http', RunTestController])
  .directive('resultCell', [resultCellDirective])
  .directive('resultTable', [resultTableDirective]);

function resultCellDirective(){
  return {
    restrict:'A',
    scope: {result:'=resultCell', hover:'&'},
    templateUrl:'/templates/cell.html'
  };
}

function resultTableDirective(){
  return {
    restrict:'A',
    replace:true,
    scope: {
      result:'=resultTable',
      methods:'=',
      codes:'=',
      parentHover:'&hover'
    },
    templateUrl:'/templates/table.html'
  };
}

function RunTestController ($location, $http) {
  this.methods = common.HTTP_METHODS;
  this.codes = common.REDIRECT_CODES;
  this.started = false;
  this.hoverMethod = false;
  this.hoverCode = false;
  this.keys = [];

  this.run = function(id) {
    this.started = true;
    var p1 = runTest(id);
    this.result = p1.result;
    this.selectedKey = 'running';
    var self = this;
    p1.then(function(result){
      self.selectedKey = self.result.agent;
      console.log('all done!');
      console.log(result);
    });
  };

  this.view = function() {
    var self = this;
    $http.get('/testData').then(function(result) {
      self.viewData = result.data;
      console.log(result.data);
      self.keys = Object.keys(self.viewData);
      if (!self.selectedKey && self.keys.length) {
        self.selectedKey = self.keys[0];
      }
    });
  };

  this.tableData = function() {
    if (this.selectedKey === 'running' || (!this.viewData && this.result)) {
      return this.result.data;
    } else {
      var viewData = this.selectedViewData();
      return viewData && viewData.data;
    }
  };

  this.selectedViewData = function(){
    return this.viewData && this.viewData[this.selectedKey] && this.viewData[this.selectedKey];
  };

  this.hoverData = function () {
    var code = this.hoverCode;
    var method = this.hoverMethod;
    var viewData = this.selectedViewData();
    if (code && method && viewData && viewData.requestLogs) {
      var dat = viewData.requestLogs[method] && viewData.requestLogs[method][code];
      console.log(dat);
      return dat;
    }
  };

  this.hover = function(method, code) {
    console.log('hovering', method, code);
    this.hoverMethod = method;
    this.hoverCode = code;
  };

  var search = $location.search();
  if (search.hasOwnProperty('id')) {
    var id = parseInt(search.id, 10);
    assert.strictEqual('' + id, search.id);
    this.run(id);
  }
}

function setPromiseScheduler ($rootScope){
  Promise.setScheduler(function(fn){
    $rootScope.$evalAsync(fn);
  });
}
