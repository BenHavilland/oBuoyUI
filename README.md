# oBuoyUI
frontend for oBuoy

## Components
 * AngularJS v1.5.3
 * AngularUI v0.2.13
 * Ionic v1.3.3
 * FirebaseJs 3.2.0
 * AngularFire 2.0.1

## Main App Logic
 * **Controllers:** https://github.com/clickyspinny/oBuoyUI/blob/master/www/js/controllers.js
 * **Services:** https://github.com/clickyspinny/oBuoyUI/blob/master/www/js/services.js

## Running

### Local

#### Get the repo
`git clone git@github.com:clickyspinny/oBuoyUI.git`

#### Fire up a static http server of your choice

With nodejs and http-server https://www.npmjs.com/package/http-server
```
npm install http-server -g
cd oBuoyUI/www
http-server
```

With python SimpleHttpServer
```
cd oBuoyUI/www
python -m SimpleHTTPServer
```

With firebase local server https://firebase.google.com/docs/hosting/quickstart
```
npm install -g firebase-tools
cd oBuoyUI
firibase init
firebase serve
```



