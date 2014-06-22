(function() {
    var as = angular.module('myApp.controllers', []);
    as.controller('AppCtrl',['$scope', '$rootScope', '$http', 'i18n', '$location', 'apiUrl', function($scope, $rootScope, $http, i18n, $location, apiUrl) {
        $scope.language = function() {
            return i18n.language;
        };
        $scope.setLanguage = function(lang) {
            i18n.setLanguage(lang);
        };
        $scope.activeWhen = function(value) {
            return value ? 'active' : '';
        };

        $scope.path = function() {
            return $location.url();
        };

        $scope.login = function() {
            $scope.$emit('event:loginRequest', $scope.username, $scope.password);
        };

        $scope.logout = function() {
            $rootScope.user = null;
            $scope.username = $scope.password = null;
            $scope.$emit('event:logoutRequest');
        };


    }]);

    as.controller('ProjectListCtrl', ['$scope', '$rootScope', '$http', '$location', 'apiUrl', function($scope, $rootScope, $http, $location, apiUrl) {
        var load = function() {
            console.log('call load()...');
            $http.get(apiUrl + '/projects.json')
                    .success(function(data, status, headers, config) {
                        $scope.projects = data;
                        angular.copy($scope.projects, $scope.copy);
                    });
        }

        load();

        $scope.addProject = function() {
            console.log('call addProject');
            $location.path("/new");
        }

        $scope.editProject = function(index) {
            console.log('call editProject');
            $location.path('/edit/' + $scope.projects[index].id);
        }

        $scope.delProject = function(index) {
            console.log('call delProject');
            var todel = $scope.projects[index];
            $http
                    .delete(apiUrl + '/projects/' + todel.id + '.json')
                    .success(function(data, status, headers, config) {
                        load();
                    }).error(function(data, status, headers, config) {
            });
        }

    }]);

    as.controller('NewProjectCtrl', ['$scope', '$rootScope', '$http', '$location', 'apiUrl', function($scope, $rootScope, $http, $location, apiUrl) {

        $scope.project = {};

        $scope.saveProject = function() {
            console.log('call saveProject');
            $http
                    .post(apiUrl + '/projects.json', $scope.project)
                    .success(function(data, status, headers, config) {
                        $location.path('/projects');
                    }).error(function(data, status, headers, config) {
            });
        }
    }]);

    as.controller('EditProjectCtrl', ['$scope', '$rootScope', '$http', '$location', 'apiUrl', function($scope, $rootScope, $http, $routeParams, $location, apiUrl) {

        var load = function() {
            console.log('call load()...');
            $http.get(apiUrl + '/projects/' + $routeParams['id'] + '.json')
                    .success(function(data, status, headers, config) {
                        $scope.project = data;
                        angular.copy($scope.project, $scope.copy);
                    });
        }

        load();

        $scope.project = {};

        $scope.updateProject = function() {
            console.log('call updateProject');
            $http
                    .put(apiUrl + '/projects/' + $scope.book.id + '.json',  $scope.book)
                    .success(function(data, status, headers, config) {
                        $location.path('/projects');
                    }).error(function(data, status, headers, config) {
            });
        }
    }]);
}());
