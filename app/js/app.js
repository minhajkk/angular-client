(function() {

    var
            //the HTTP headers to be used by all requests
            httpHeaders,
            //the message to be shown to the user
            message,



    as = angular.module('myApp', ['myApp.filters', 'myApp.services', 'myApp.directives', 'myApp.controllers']);
    as.value('version', '1.0.7');
    as.value('apiUrl', 'http://localhost:8080/scrum-server/v2/api');
    as.config(function($routeProvider, $httpProvider) {
        $routeProvider
                .when('/projects', {templateUrl: 'partials/projects.html', controller: 'ProjectListCtrl'})
                .when('/new', {templateUrl: 'partials/new.html', controller: 'NewProjectCtrl'})
                .when('/edit/:id', {templateUrl: 'partials/edit.html', controller: 'EditProjectCtrl'})
                .otherwise({redirectTo: '/'});
       // $httpProvider.defaults.useXDomain = true;
       // delete $httpProvider.defaults.headers.common["X-Requested-With"];
        console.log('@X-Requested-With@'+$httpProvider.defaults.headers.common["X-Requested-With"])
    });

    as.config(function($httpProvider) {
        //configure $http to catch message responses and show them
        $httpProvider.responseInterceptors.push(
                function($q) {
                    console.log('call response interceptor and set message...');
                    var setMessage = function(response) {
                        //if the response has a text and a type property, it is a message to be shown
                        //console.log('@data'+response.data);
                        if (response.data.message) {
                            message = {
                                text: response.data.message.text,
                                type: response.data.message.type,
                                show: true
                            };
                        }
                    };
                    return function(promise) {
                        return promise.then(
                                //this is called after each successful server request
                                        function(response) {
                                            setMessage(response);
                                            return response;
                                        },
                                        //this is called after each unsuccessful server request
                                                function(response) {
                                                    setMessage(response);
                                                    return $q.reject(response);
                                                }
                                        );
                                    };
                        });

                //configure $http to show a login dialog whenever a 401 unauthorized response arrives
                $httpProvider.responseInterceptors.push(
                        function($rootScope, $q) {
                            console.log('call response interceptor...');
                            return function(promise) {
                                return promise.then(
                                        //success -> don't intercept
                                                function(response) {
                                                    console.log('dont intercept...');
                                                    return response;
                                                },
                                                //error -> if 401 save the request and broadcast an event
                                                        function(response) {
                                                            console.log('execute interceptor, response@' + response.status);
                                                            if (response.status === 401) {
                                                                console.log('catching http status:401');
                                                                var deferred = $q.defer(),
                                                                        req = {
                                                                            config: response.config,
                                                                            deferred: deferred
                                                                        };
                                                                $rootScope.requests401.push(req);
                                                                $rootScope.$broadcast('event:loginRequired');
                                                                return deferred.promise;
                                                            }
                                                            return $q.reject(response);
                                                        }
                                                );
                                            };
                                });
                        httpHeaders = $httpProvider.defaults.headers;
                        //console.log('http headers:'+ httpHeaders);
                    });

                    as.run(function($rootScope, $http, $location, base64, apiUrl) {
                        //make current message accessible to root scope and therefore all scopes
                        $rootScope.message = function() {
                            return message;
                        };

                        /**
                         * Holds all the requests which failed due to 401 response.
                         */
                        $rootScope.requests401 = [];

                        $rootScope.$on('event:loginRequired', function() {
                            console.log('fire event:loginRequired');
                            $('#login').modal('show');

                        });

                        /**
                         * On 'event:loginConfirmed', resend all the 401 requests.
                         */
                        $rootScope.$on('event:loginConfirmed', function() {
                            var i,
                                    requests = $rootScope.requests401,
                                    retry = function(req) {
                                        $http(req.config).then(function(response) {
                                            req.deferred.resolve(response);
                                        });
                                    };

                            for (i = 0; i < requests.length; i += 1) {
                                retry(requests[i]);
                            }
                            $rootScope.requests401 = [];

                            $('#login').modal('hide');
                        });

                        /**
                         * On 'event:loginRequest' send credentials to the server.
                         */
                        $rootScope.$on('event:loginRequest', function(event, username, password) {
                            console.log('fire event: loginRequest. @event,' + event + ', username @' + username + ', password@' + password);
                            //httpHeaders.common['Authorization'] = 'Basic ' + base64.encode(username + ':' + password);
							              console.log('try to login');
                            $http.post(apiUrl + '/auth/login', {username: username, password: password})
                                    .success(function(data) {
                                        console.log('login token @' + data.token);
                                        console.log('login username @' + data.username);

                                        httpHeaders.common['X-AUTH-TOKEN'] = data.token;
                                        $rootScope.user = data.user;
                                        $rootScope.username = data.username;
                                        $rootScope.password = data.password;
                                        $rootScope.$broadcast('event:loginConfirmed');
                                    }).
                                    error(function(data) {
                                      $rootScope.$broadcast('event:loginFailed');
                                    });

                        });
                        $rootScope.$on('event:loginFailed', function () {
                            console.log('showing login error message');
                            $('#login-error').show();
                        });

                        /**
                         * On 'logoutRequest' invoke logout on the server and broadcast 'event:loginRequired'.
                         */
                        $rootScope.$on('event:logoutRequest', function() {
                          delete $http.defaults.headers.common["X-AUTH-TOKEN"]
                          $rootScope.user = null;
                          sessionStorage.clear();
                          $location.path("/login")
                           // $http.get(apiUrl + '/unauthenticate')
                          //          .success(function(data) {
                           //             httpHeaders.common['Authorization'] = null;
                           //         });
						                            $rootScope.user=null;
							                                 $location.path('/');
                        });
                    });


                }());
