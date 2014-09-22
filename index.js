/**
 * Created by Derek on 2014/9/18.
 */

var AppDB = require('./lib/appdb.js');

var options = require('./lib/config.json');
var WebServer = require('./lib/webserver.js');

options = options || {};
options.webserver_port = options.webserver_port || 7001;
options.mongodb_url = options.mongodb_url || "mongodb://127.0.0.1/XSAppDB";

var appDB = new AppDB({url: options.mongodb_url});

new WebServer(appDB, options).run();
