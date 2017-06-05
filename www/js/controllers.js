angular.module('app.controllers', [])
  
.controller('resultsCtrl', ['$scope', '$rootScope', '$state', '$stateParams', '$firebaseObject', '$firebaseArray', '$ionicUser', '$ionicAuth', '$ionicHistory', 'geoQueryFactory', '$ionicLoading', '$ionicNavBarDelegate', function ($scope, $rootScope, $state, $stateParams, $firebaseObject, $firebaseArray, $ionicUser, $ionicAuth, $ionicHistory,  geoQueryFactory, $ionicLoading, $ionicNavBarDelegate) {
    
    // if not logged in go to our "login" page
    if (!$ionicAuth.isAuthenticated()) {
        $state.go('login');
    } else {
        // set our firebase reference
        var ref = firebase.database().ref().child("buoys");
        $scope.savedBuoys = $firebaseArray(ref.orderByChild("email").equalTo($ionicUser.details.email));   
    }
    
    // set variables for error and message display
    $scope.noResults = true;
    $rootScope.error = false;

    var processGeoQuery = function(){
        // show the loading spinner
        $ionicLoading.show();
        
        // kick off the query
        geoQueryFactory.asyncRadiusQuery(theQuery).then(function(retData){
            // parse the data
            var liveData = JSON.parse(retData.body);
            // in order to see if this record is one of our saved ones we
            // map to get the binding record id and attach it to buoy object if exists
            liveData.map(function (fd) {
                searchObj($scope.savedBuoys, fd.STN.S, function(fbObj){
                    fd.saved = true;
                    fd.fbId = fbObj.$id;
                });
            });
            // let our error box know we've processed a query
            $scope.noResults = false;
            // update the model in with all of the new values so the UI displays changes
            $scope.buoys = liveData;
        }).catch(function(err){
            // if the query errors it's due to data limitations and it indicates
            // that we need to purchase more data reads on production dynamodb
            console.log(err);
            $rootScope.error = 'Covfefe! I didn\'t purchase a ton of data throughput for the alpha. Try again in 30 seconds please.';
            // don't let people use back from next page if we send them there because of this error
            $ionicHistory.nextViewOptions({
                disableBack: true,
                historyRoot: true
            });
            $state.go('findBuoys');
        })
        .finally($ionicLoading.hide);//hide the loader animation
    };

    // this should only load if passed these 3 params, if not go back to search
    if (!$stateParams.Radius || !$stateParams.Lat || !$stateParams.Long) {
        $rootScope.error = false;
        $ionicLoading.hide();
        $state.go('findBuoys');
    } else {
        var theQuery = {
            "operation": "read",
            "radiusQuery": {
                "RadiusInMeter": $stateParams.Radius*1000,
                "CenterPoint": {
                    "latitude": parseFloat($stateParams.Lat).toFixed(1) *1,
                    "longitude": parseFloat($stateParams.Long).toFixed(1) *1
                }
            }
        };
        processGeoQuery();
    }

    //FIX ME
    $scope.b = {
        saved: function(value){
            console.log(value);
            return true;
        }
    };
    
    // ui helper for parsing coordinate strings
    $scope.getCoords = function(coordString){
        return JSON.parse(coordString);
    };
    
    // react to a click on the Save/Saved button
    $scope.toggleSavedBuoy = function (b){
        //flip and check the value of the checkbox toggle
        b.saved=!b.saved;
        if ('fbId' in b){
            // Toggle off: remove record from my buoys
            ref.child(b.fbId).remove();
            // remove the recording binding value
            delete b.fbId;
        } else {
            // Toggle on: add record to my buoys
            var epochTime = Date.now();
            $scope.savedBuoys.$add({
                name: b.STN.S,
                added: epochTime,
                email: $ionicUser.details.email,
                order: 0
            }).then(//this function expects 2 functions to be passed to the then() function
                function(p){
                    //add binding data from geoquery db to private user record
                    b.fbId = p.path.o[1];
                }, 
                function(err){
                    //error
            });
        }
    };
    
    // helper function for recursive object search
    var searchObj = function (obj, query, callback) {
        for (var key in obj) {
            var value = obj[key];
            if (value === query) callback(obj);
            if (typeof value === 'object') searchObj(value, query, callback);
        }
    };

}])
   
.controller('myBuoysCtrl', ['$scope', '$rootScope', '$state', '$ionicAuth', '$ionicUser', '$firebaseArray', '$firebaseObject', '$ionicLoading', '$timeout', 'geoQueryFactory', function ($scope, $rootScope, $state, $ionicAuth, $ionicUser, $firebaseArray, $firebaseObject, $ionicLoading, $timeout, geoQueryFactory) {
    
    // poll for new buoy readings while in this controller
    // every 15 seconds - from our dynamodb microservice
    var tick = function(){
        $timeout.cancel($rootScope.tickerPromise);
        // only tick if we're in My Buoys
        if ($state.current.controller != 'myBuoysCtrl'){
            return "done ticking";
        }
        // get our user's data-child for their saved buoys, put on scope
        $scope.ref = ref.orderByChild("email").equalTo($ionicUser.details.email);
        // convert data into a live array
        $scope.savedBuoys = $firebaseArray($scope.ref);
        // confirm the data is here and then iterate over it
        $scope.savedBuoys.$loaded()
        .then(function(){
            angular.forEach($scope.savedBuoys, function(b) {
                // query each buoy by name and pull in the current readings
                // from dynamodb microservice
                getBuoyData(b);
            });
            // keep the warning box hidden
            $scope.noResults = false;
                
            // hide spinner, if active
            $ionicLoading.hide();
            // make the ticker tick
            console.log('tick');
            $rootScope.tickerPromise = $timeout(tick, 15000);
        });
    };
    
    // if not logged in go to our "login" page
    if (!$ionicAuth.isAuthenticated()) {
        $state.go('login');
    } else {
        // show the page loading spinner
        $ionicLoading.show();
        // define our saved buoy data source from our firebase user records
        var ref = firebase.database().ref().child("buoys");
        // begin polling our data
        tick();
    }
    
    // keep our error display hidden until we make a query
    $scope.noResults = true;
    
    // utility search function... maybe angular has this already
    var searchObj = function (obj, query, callback) {
        for (var key in obj) {
            var value = obj[key];
            if (value === query) callback(obj);
            if (typeof value === 'object') searchObj(value, query, callback);
        }
    };
    
    // ui helper for parsing coordinate strings
    $scope.getCoords = function(coordString){
        return JSON.parse(coordString);
    };
    
    // process delete actions
    $scope.removeBuoy = function(b){
        ref.child(b.$id).remove();
    };
    
    // prepare and make the query to dynamodb for a live buoy reading
    var getBuoyData = function (buoy){
        // prepare querystring
        var theQuery = {
          "operation": "read",
          "STN": String(buoy.name)
        };
        
        // fire off the query
        geoQueryFactory.asyncBuoyGet(theQuery).then(function(retData){
            // make nice json
            var freshData = JSON.parse(retData.body);
            // add/replace the values displayed in the ui with current reading
            buoy.name = freshData[0].STN;
            buoy.liveData = freshData[0];
            buoy.liveData.coordinates = $scope.getCoords(freshData[0].geoJson);
        });
    };
}])
   
.controller('findBuoysCtrl', ['$scope', '$rootScope', '$state', '$ionicAuth', '$cordovaGeolocation', '$ionicPlatform', '$ionicLoading', function ($scope, $rootScope, $state, $ionicAuth, $cordovaGeolocation, $ionicPlatform, $ionicLoading) {

    // if not logged in go to our "login" page
    if (!$ionicAuth.isAuthenticated()) $state.go('login');

    // default search form values
    $scope.queryInfo = {
        Lat:0,
        Long:0,
        Radius: 80.46
    };

    // make sure we check the state of our button before we get location
    $scope.toggleLocation = function(value) {
        if (value === true){
           $scope.getLocation();
        }
    };

    // set geolocation options
    var positionOptions = {timeout: 10000, enableHighAccuracy: false};
    
    // geolocation must wait for the dom/device to be ready to init
    $ionicPlatform.ready(function(){
        $scope.getLocation = function() {
            $ionicLoading.show();
            $cordovaGeolocation
            .getCurrentPosition(positionOptions)
            .then(function (position) {
                $scope.queryInfo.Lat  = position.coords.latitude;
                $scope.queryInfo.Long = position.coords.longitude;
            }, function(err) {
                // error
            })
            .finally($ionicLoading.hide);
        };
    }, false);
}])
      
.controller('menuCtrl', ['$scope', '$rootScope', '$ionicUser', '$ionicAuth', '$state', '$ionicSideMenuDelegate', function ($scope, $rootScope, $ionicUser, $ionicAuth, $state, $ionicSideMenuDelegate) {
    
    // update our menu with our name and email
    var checkLoggedIn = function (){
        if ($ionicAuth.isAuthenticated()) {
            $scope.userData = $ionicUser.details;
        } else {
            $scope.userData = {}; 
        }
    };
    
    // listen for login changes so we can update the menu
    $scope.$on('login_change', checkLoggedIn);

    $scope.logout = function(){
        $ionicAuth.logout();
        $scope.userData = {};
        $ionicSideMenuDelegate.toggleLeft(false);
        $rootScope.$broadcast('login_change');
        $state.go('login');
    };
    
    // call once on controller load to set menu state
    checkLoggedIn();
}])
   
.controller('signupCtrl', ['$scope', '$rootScope', '$state', '$ionicAuth', '$ionicHistory', '$ionicLoading', function ($scope, $rootScope, $state, $ionicAuth, $ionicHistory, $ionicLoading) {

    // if logged in go to our "home" page
    if ($ionicAuth.isAuthenticated()) $state.go('myBuoys');

    $scope.data = {
        'name': '',
        'email': '',
        'password': ''
    };

    $scope.signup = function(){
        $scope.error = '';
        $ionicAuth.signup($scope.data).then(function() {
            $ionicLoading.show();
            $ionicAuth.login('basic', $scope.data).then(function(){
                // update our menu with an event broadcast
                $rootScope.$broadcast('login_change');
                // don't let people use back from next page
                $ionicHistory.nextViewOptions({
                    disableBack: true,
                    historyRoot: true
                });
                // go to our "home" page
                $state.go('myBuoys');
            });
        }, function(err) {
            // verbose errors from ionic auth return values
            var error_lookup = {
                'required_email': 'Missing email field',
                'required_password': 'Missing password field',
                'conflict_email': 'A user has already signed up with that email',
                'conflict_username': 'A user has already signed up with that username',
                'invalid_email': 'The email did not pass validation'
            };
            $scope.error = error_lookup[err.details[0]];
        })
        .finally($ionicLoading.hide);//hide the loader animation
    };

}])
   
.controller('loginCtrl', ['$scope', '$rootScope', '$state', '$ionicAuth', '$ionicHistory', '$ionicLoading', '$ionicNavBarDelegate', function ($scope, $rootScope, $state, $ionicAuth, $ionicHistory, $ionicLoading, $ionicNavBarDelegate) {

    // if logged in go to our "home" page
    if ($ionicAuth.isAuthenticated()) $state.go('myBuoys');

    //$ionicNavBarDelegate.showBar(true);

    // set our model for the page
    $scope.data = {
        'email': '',
        'password': ''
    };
    
    $scope.signup = function(){
        $ionicAuth.logout();
        $rootScope.$broadcast('login_change');
    };
    
    $scope.login = function(){
        // clear any errors
        $scope.error = '';
        // show the loader animation
        $ionicLoading.show();
        $ionicAuth.login('basic', $scope.data).then(function(){
            // update our menu with an event broadcast
            $rootScope.$broadcast('login_change');
            // don't let people use back from next page
            // $ionicHistory.nextViewOptions({
            //     disableBack: true,
            //     historyRoot: true
            // });
            // go to our "home" page
            $state.go('myBuoys');
        }, function(){
            $scope.error = 'Error logging in.';
        })
        .finally(function(){
            setTimeout($ionicLoading.hide, 50);
        });//hide the loader animation
    };
}])
 