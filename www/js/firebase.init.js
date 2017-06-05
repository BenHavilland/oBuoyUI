angular.module('firebaseConfig', ['firebase'])

.run(function(){

  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyCkf763iQD9Gfi4qQwRoQ1KeGsUJWcnXAU",
    authDomain: "obuoy-afda5.firebaseapp.com",
    databaseURL: "https://obuoy-afda5.firebaseio.com",
    projectId: "obuoy-afda5",
    storageBucket: "obuoy-afda5.appspot.com",
    messagingSenderId: "446563280881"
  };
  firebase.initializeApp(config);

});