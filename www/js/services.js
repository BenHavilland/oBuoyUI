angular.module('app.services', [])

.factory('BlankFactory', [function(){

}])

// this app currently uses ionic auth but this is a placeholder
// for rolling custom auth or changing to another provider
.factory('Auth', function(){
    var user;

    return{
        setUser : function(aUser){
            user = aUser;
    },
    isLoggedIn : function(){
        return(user)? user : false;
    }
  }
})

.factory('geoQueryFactory', function($http) {
$http.defaults.headers.post["Content-Type"] = "application/json";

    var queryActions = {
        // geo radius queries.  a magical thing.  slower for larger radius values
        // timeout is increased for larger payloads
        asyncRadiusQuery: function(payload) {
            var promise = $http({
                url: 'https://xmblpzoyw2.execute-api.us-west-2.amazonaws.com/prod/radiusQuery',
                method: 'POST',
                headers: 'Content-Type:application/json',
                data: payload
            },{timeout: 90000}).then(function (response) {
                return response.data;
            });
        // return the promise to the controller
        return promise;
        },
        
        // grabs single buoy records from our live dynamodb
        // this is what the tick() function calls on in MyBuoys
        asyncBuoyGet: function(payload) {
            var promise = $http({
                url: 'https://xmblpzoyw2.execute-api.us-west-2.amazonaws.com/prod/getRecord',
                method: 'POST',
                headers: 'Content-Type:application/json',
                data: payload
            }).then(function (response) {
            return response.data;
        });
        // return the promise to the controller
        return promise;
        }
    };
    return queryActions;
});