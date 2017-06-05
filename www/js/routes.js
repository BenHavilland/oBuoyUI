angular.module('app.routes', [])

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider
    

      .state('results', {
    url: '/results',
	params: {
		Lat: "",
		Long: "",
		Radius: ""		
},
    templateUrl: 'templates/results.html',
    controller: 'resultsCtrl'
  })

  .state('myBuoys', {
    url: '/mybuoys',
    templateUrl: 'templates/myBuoys.html',
    controller: 'myBuoysCtrl'
  })

  .state('findBuoys', {
    url: '/findbuoys',
	params: {
		name: "",
		doingNow: ""		
},
    templateUrl: 'templates/findBuoys.html',
    controller: 'findBuoysCtrl'
  })

  .state('tabsController', {
    url: '/page1',
    templateUrl: 'templates/tabsController.html',
    abstract:true
  })

  .state('signup', {
    url: '/signup',
    templateUrl: 'templates/signup.html',
    controller: 'signupCtrl'
  })

  .state('login', {
    url: '/login',
    templateUrl: 'templates/login.html',
    controller: 'loginCtrl'
  })

$urlRouterProvider.otherwise('/login')


});