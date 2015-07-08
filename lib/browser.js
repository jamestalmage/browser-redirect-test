var runTest = require('./run-test');
var common = require('./common');
var angular = require('angular');
var Promise = require('bluebird');
var assert = require('assert');
var flatten = require('./flatten-dataset');
var iconUrl = require('./fetch-icon-url');

angular.module('browser-redirect-test', [])
  .run(['$rootScope', setPromiseScheduler])
  .controller('RunTestController', ['$location', '$http', RunTestController])
  .directive('resultCell', [resultCellDirective])
  .directive('resultTable', [resultTableDirective])
  .directive('describeAgent', [describeAgentDirective])
  .filter('uricomponent', function() {
    return function(input) {
      return encodeURIComponent(input);
    };
  });

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

function describeAgentDirective(){
  return {
    restrict: 'A',
    scope: {
      combinedAgentData: '=describeAgent'
    },
    templateUrl:'/templates/describe-behavior.html',
    controller: function($scope) {
      this.iconUrl = iconUrl;
    },
    controllerAs: 'ctrl'
  };
}

function RunTestController ($location, $http) {
  var self = this;
  this.methods = common.HTTP_METHODS;
  this.codes = common.REDIRECT_CODES;
  this.running = false;
  this.hoverMethod = false;
  this.hoverCode = false;
  this.keys = [];

  this.run = function(id) {
    this.started = true;
    var p1 = runTest(id);
    this.result = p1.result;
    this.selectedKey = 'running';
    p1.then(function(result){
      self.selectedKey = self.result.agentNickname;
      console.log('all done!', self.selectedKey);
    }).finally(function() {
      self.running = false;
    });
  };

  this.view = function() {
    $http.get('/testData').then(function(result) {
      self.viewData = result.data;
      console.log('viewData', self.viewData);
      self.flatData = flatten.flattenAggregateData(self.viewData);
      console.log('flatData', self.flatData);
      self.keys = Object.keys(self.viewData);
      if (!self.selectedKey && self.keys.length) {
        self.selectedKey = self.keys[0];
      }
    });
  };

  this.selectedRun = 'firstRun';

  this.tableData = function() {
    if (this.selectedKey === 'running' || (!this.viewData && this.result)) {
      return this.result.data;
    } else {
      var selectedData = this.viewData && this.viewData[this.selectedKey];
      return selectedData &&  selectedData.browserLogs[this.selectedRun];
    }
  };

  this.hoverData = function (run) {
    var code = this.hoverCode;
    var method = this.hoverMethod;
    var fd = this.flatData;
    return fd && fd[run] && fd[run][method] && fd[run][method][code];
  };

  this.hover = function(method, code) {
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
