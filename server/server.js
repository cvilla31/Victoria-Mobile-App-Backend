var packageVersion = require('./../package.json').version;

console.log("Victoria-Mobile-App-Backend v" + packageVersion);

var express = require("express");
var expressSession = require("express-session");
var FileStore = require('session-file-store')(expressSession);
var cfenv = require("cfenv");
var bodyParser = require('body-parser');
var iconv = require('iconv-lite');
var nconf = require("nconf");
var vcapLocal = require('./vcap-local.json'); //Configuration for local
var VCAP_SERVICES = "VCAP_SERVICES"; //Configuration form Bluemix Services
const vcapServices = JSON.parse(process.env[VCAP_SERVICES] || JSON.stringify(vcapLocal));
const HOST = 'uxorlab.uxorit.com';
const PORT = 10039; //FIXME Use 10029 for production
var app = express();
var store = new FileStore();
var querystring = require('querystring');
var http = require("http"); //FIXME Use https for production

app.use(expressSession({
  store , 
  secret: vcapServices.AdvancedMobileAccess[0].credentials.secret, 
  cookie: { maxAge: 10000 }, 
  saveUninitialized: false
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

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
  
  var usuario = request.query.userid;
  var clave = request.query.password;
  
  var options = {
    host: HOST, 
    port: PORT, 
    path: '/wps/portal/cxml/04_SD9ePMtCP1I800I_KydQvyHFUBADPmuQy?userid=' + usuario + '&password=' + clave,
    method: 'GET'
  };

  var req = http.request(options, function(res)
  {
    var output;
    console.log(options.host + ':' + res.statusCode);
    
    switch (res.statusCode) {
    case 302:
      store.set(request.session.id, request.session, function(err) {
        if (err) {
          res.statusCode = 401;
          output = {"authenticated": false};
          onResult(res.statusCode, output);
        } else {
          res.statusCode = 200;
          output = {"authenticated": true, "token":request.session.id};
          onResult(res.statusCode, output);
        }
      });
      break;
    case 404:
      res.statusCode = 401;
      output =  {"authenticated": false};
      onResult(res.statusCode, output);
      break;
    default:
      res.statusCode = 401;
      output = {"error": "Error al consumir servicio de Backend", "authenticated": false};
      onResult(res.statusCode, output);
      break;
    }
  });

  req.on('error', function(err) {
    onResult('500', {'error': 'Error al consumir servicio de Backend', "authenticated": false});
  });

  req.end();
});

/** 
 * Middleware API Mobile Backend
 * Victoria-Mobile-App -> Victoria-Mobile-App-Backend 
 * 
 * @param req: Solicitud desde Victoria-Mobile-App
 * @param res: Respuesta a Victoria-Mobile-App
 */
app.get("/api/v1/autos/*", function (req, res) {
  var sess = req.session;
  var tokenId = req.query.tokenId;
  
  store.get(tokenId, function(err, validSession) { 
    if (err) {
      console.log("Ocurrió un error al obtener la sesión guardada");
      console.log(err);
      res.send(401,{});
    } else {
      if (validSession) {
        backendService(req, function(status, result) { res.status(status).send(result); } );
      } else {
        res.send(401,{});
      }
    }
  });
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
    host: HOST, 
    port: PORT,
    path: '/wps/PA_CEA-Admin/services' + path,
    method: request.method
  };

  var req = http.request(options, function(res)
  {
    var chunks = [];

    if (res.statusCode != '200') {
      onResult('500', {'error': 'Error al consumir servicio de Backend'});
      console.log(res);
    } else {

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

var port = process.env.PORT || 3000;

app.listen(port, function() {
    console.log("To view your app, open this link in your browser: http://localhost:" + port);
});