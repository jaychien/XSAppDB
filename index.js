/**
 * Created by Derek on 2014/9/18.
 */

var AppDB = require('./lib/appdb.js');

var options = require('./lib/config.json');
var WebServer = require('./lib/webserver.js');

options = options || {};
options.port = options.port || 7001;
options.mongodb = options.mongodb || "mongodb://127.0.0.1/XSAppDB";
options.marketserver = options.marketserver || "http://203.67.19.128";
options.env = options.env || '';

var appDB = new AppDB({mongodb: options.mongodb, marketserver: options.marketserver});

new WebServer(appDB, options.port, options.env).run();
