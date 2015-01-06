/*jslint plusplus: true, vars: true*/
/*global angular:true, window:true, gapi: true */
(function () {
	'use strict';
	
	function GapiService($q, $rootScope, $window, apiKey) {
		var service = $rootScope.$new(true);
		service.gapiServiceReady = $q.defer();

		$window.angularGoogleApiWrapperInit = function () {
			service.initGapi();
		};

		var tag = document.createElement('script');
		tag.src = "https://apis.google.com/js/client.js?onload=angularGoogleApiWrapperInit";
		var firstScriptTag = document.getElementsByTagName('script')[0];
		firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

		service.initGapi = function () {
			gapi.client.setApiKey(apiKey);
			service.$apply(service.gapiServiceReady.resolve());
		};
		
		function returnFunctionByName(functionName, context) {
			var namespaces = functionName.split('.');
			var i;
			for (i = 0; i < namespaces.length; i++) {
				context = context[namespaces[i]];
			}
			return context;
		}
		
		service.ConstructAPICallMethod = function (apiReaderPromise, method) {
			return function (args) {
				var deferred = $q.defer();
				
				apiReaderPromise.promise.then(function () {
					var request = returnFunctionByName(method, $window)(args);

					request.execute(function (data) {
						deferred.resolve(data);
					}, function (response) {
						deferred.reject(response);
					});
				});

				return deferred.promise;
			};
		};

		return service;
	}
	GapiService.$inject = ['$q', '$rootScope', '$window', 'apiKey'];
	
	function GapiServiceProvider() {
		var apiKey = null;
		
		this.setApiKey = function (newKey) {
			apiKey = newKey;
		};
		
		this.$get = ['$q', '$rootScope', '$window', function GapiServiceFactory($q, $rootScope, $window) {
			if (apiKey === null) {
				throw ("Please set key before callign webservice");
			}
			return new GapiService($q, $rootScope, $window, apiKey);
		}];
	}
	
	angular.module('angularGoogleApiWrapper', [])
		.provider('gapiService', GapiServiceProvider)
		.service('googleYouTubeAPI', function ($q, $rootScope, gapiService) {
			var youtubeAPIready = $q.defer();
		
			gapiService.gapiServiceReady.promise.then(function () {
				gapi.client.load('youtube', 'v3', function () {
					youtubeAPIready.resolve();
				});
			});

			this.activities = {};
			this.activities.list = gapiService.ConstructAPICallMethod(youtubeAPIready, 'gapi.client.youtube.activities.list');
		
			this.playlistItems = {};
			this.playlistItems.list = gapiService.ConstructAPICallMethod(youtubeAPIready, 'gapi.client.youtube.playlistItems.list');
		});
}());
