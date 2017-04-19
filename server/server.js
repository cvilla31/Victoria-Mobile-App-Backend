var packageVersion = require('./../package.json').version;
console.log("Victoria-Mobile-App-Backend v" + packageVersion);

var express = require("express");
var cfenv = require("cfenv");
var bodyParser = require('body-parser');
var iconv = require('iconv-lite');

var app = express();

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// ---------------------------- Unprotected mobile backend --------------------------------
var querystring = require('querystring');

//var https = require('https');
//var host = 'uxorlab.uxorit.com:10029/wps/PA_CEA-Admin/services';
var http = require("http");
var host = 'uxorlab.uxorit.com';

/** 
 * Middleware API Mobile Backend
 * Victoria-Mobile-App -> Victoria-Mobile-App-Backend 
 * 
 * @param request: Solicitud desde Victoria-Mobile-App
 * @param response: Respuesta a Victoria-Mobile-App
 */
app.get("/api/v1/autos/*", function (request, response) {
  backendService(request, function(status, result) { response.statusCode = status; response.send(result); } );
});

/** 
 * Middleware API Mobile Backend
 * Victoria-Mobile-App -> Victoria-Mobile-App-Backend 
 * 
 * @param request: Solicitud desde Victoria-Mobile-App
 * @param response: Respuesta a Victoria-Mobile-App
 */
app.post("/api/v1/autos/*", function (request, response) {
  backendService(request, function(status, result) { response.statusCode = status; response.send(result); } );
});

/** 
 * Middleware API Mobile Backend -> Core Backend Services 
 * 
 * @param path: http options object
 * @param callback: callback to pass the results JSON object(s) back
 */
function backendService(request, onResult) {
  var path = request.url.substring(13); // -> /api/v1/autos/*
  
  var options = {
    host: host, 
    port: 10039,
    path: '/wps/PA_CEA-Admin/services' + path,
    method: request.method
  };

  var req = http.request(options, function(res)
  {
    var chunks = [];

    if (res.statusCode != '200') 
      onResult('500', {'error': 'Error al consumir servicio de Backend'});
    else {

      res.on('data', function (chunk) {
        chunks.push(chunk);
      });

      res.on('error', function (chunk) {
        chunks.push(chunk);
      });
      
      res.on('end', function() {
        var obj = {};
        var output;
        
        if (chunks) {
          output = iconv.decode(Buffer.concat(chunks), 'latin1');
          obj = eval("(" + output + ")");
        }
        onResult(res.statusCode, obj);
      });
    }
  });

  req.on('error', function(err) {
    onResult('500', {'error': 'Error al consumir servicio de Backend'});
  });

  if (request.method == 'POST' && request.data) req.write(querystring.stringify(request.data));
  req.end();
};

/** 
 * Autenticación con Backend
 * Victoria-Mobile-App -> Victoria-Mobile-App-Backend 
 * 
 * @param request: Solicitud desde Victoria-Mobile-App
 * @param response: Respuesta a Victoria-Mobile-App
 */
app.get("/api/v1/login", function (request, response) {
  var onResult = function(status, result) {
      response.statusCode = status;
      response.send(result);
  };
  
  //var usuario = request.params.userid;
  //var clave = request.params.password;
  var usuario = request.query.userid;
  var clave = request.query.password;
  
  
  var options = {
    host: host, 
    port: 10039,
    path: '/wps/portal/cxml/04_SD9ePMtCP1I800I_KydQvyHFUBADPmuQy?userid=' + usuario + '&password=' + clave,
    method: 'GET'
  };

  var req = http.request(options, function(res)
  {
    var output;
    console.log(options.host + ':' + res.statusCode);
    
    switch (res.statusCode) {
    case 302:
      res.statusCode = 200;
      output = {"authenticated": true};
      break;
    case 404:
      res.statusCode = 200;
      output =  {"authenticated": false};
      break;
    default:
      output = {"error": "Error al consumir servicio de Backend"};
      break;
    }

    onResult(res.statusCode, output);
  });

  req.on('error', function(err) {
    onResult('500', {'error': 'Error al consumir servicio de Backend'});
  });

  req.end();
});

// -------------------------- Unprotected mobile backend end ------------------------------

// ------------ Protecting mobile backend with Mobile Client Access start -----------------


// Load passport (http://passportjs.org)
var passport = require('passport');

// Get the MCA passport strategy to use
//var MCABackendStrategy = require('bms-mca-token-validation-strategy').MCABackendStrategy; // package -> "bms-mca-token-validation-strategy": "^2.0.9"
//var oauthSDK = require('bms-mca-oauth-sdk'); // package -> "bms-mca-oauth-sdk": "^3.0.3"
const APIStrategy = require("bluemix-appid").APIStrategy; // package -> "bluemix-appid": "^1.0.3"

//Tell application to use passport
app.use(passport.initialize());

// Tell passport to use the MCA strategy
//passport.use(new MCABackendStrategy())
// TODO Para prueba local
passport.use(new APIStrategy({
  tenantId: "a911b5ea-5f28-4e26-aa8a-6791f4a5020c",
  oauthServerUrl: "https://appid-oauth.ng.bluemix.net/oauth/v3/a911b5ea-5f28-4e26-aa8a-6791f4a5020c"
}));


// Protect /protected endpoint which is used in Getting Started with Bluemix Mobile Services tutorials
//app.get('/api/v1/login2', passport.authenticate('mca-backend-strategy', { session: true }), function(req, res) {
//  res.send(200, req.securityContext);
//});

//Declare the API you want to protect
app.get("/api/protected",
    passport.authenticate(APIStrategy.STRATEGY_NAME, {
        session: false
    }),
    function(req, res) {
        // Get full appIdAuthorizationContext from request object
        var appIdAuthContext = req.appIdAuthorizationContext;
 
        appIdAuthContext.accessToken; // Raw access_token
        appIdAuthContext.accessTokenPayload; // Decoded access_token JSON
        appIdAuthContext.identityToken; // Raw identity_token
        appIdAuthContext.identityTokenPayload; // Decoded identity_token JSON
 
        // Or use user object provided by passport.js
        var username = req.user.name || "Anonymous";
        res.send("Hello from protected resource " + username);
    }
);

app.get("/api/login",
    passport.authenticate(APIStrategy.STRATEGY_NAME, {
      session: true
  }), function (request, response) {
  var options = {cacheSize:1000};
  
  res.send("Logged in ");
});


/** 
 * Autenticación con Backend
 * Victoria-Mobile-App -> Victoria-Mobile-App-Backend 
 * 
 * @param request: Solicitud desde Victoria-Mobile-App
 * @param response: Respuesta a Victoria-Mobile-App
 */
app.post("/api/v1/login", function (request, response) {
  var onResult = function(status, result) {
    response.statusCode = status;
    response.send(result);
  };
  
  if (!(request.headers.authorization && request.headers.authorization.indexOf("a911b5ea-5f28-4e26-aa8a-6791f4a5020c") > 0)) {
    onResult("401", "Unauthorized");
  } else {
     
    
    var usuario = request.body.userid;
    var clave = request.body.password;
    
    
    var options = {
      host: host, 
      port: 10039,
      path: '/wps/portal/cxml/04_SD9ePMtCP1I800I_KydQvyHFUBADPmuQy?userid=' + usuario + '&password=' + clave,
      method: 'GET'
    };
  
    var req = http.request(options, function(res)
    {
      var output;
      console.log(options.host + ':' + res.statusCode);
      
      switch (res.statusCode) {
      case 302:
        res.statusCode = 200;
        output = {"authenticated": true, "token": "mitoken"};
        /*
        var options = {cacheSize:1000};
        oauthSDK.getAuthorizationHeaderBySecret(options).then(function(authHeader) {
            output.token = authHeader;
        }, function(err) {
            console.log(err);
            //TODO Eliminar propagación de error
            output.token = err;
        });
        */
        break;
      case 404:
        res.statusCode = 200;
        output =  {"authenticated": false};
        break;
      default:
        output = {"error": "Error al consumir servicio de Backend"};
        break;
      }
  
      onResult(res.statusCode, output);
    });
  
    req.on('error', function(err) {
      onResult('500', {'error': 'Error al consumir servicio de Backend'});
    });
  
    req.end();
  }
});

// ------------ Protecting backend APIs with Mobile Client Access end -----------------

var port = process.env.PORT || 3000;

app.listen(port, function() {
    console.log("To view your app, open this link in your browser: http://localhost:" + port);
});