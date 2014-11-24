/**
 * Created by Derek on 2014/9/18.
 */

var AppDB = require('./lib/appdb.js');
var MarketServer = require('./lib/marketserver.js');
var options = require('./lib/config.json');
var WebServer = require('./lib/webserver.js');

options = options || {};
options.port = options.port || 7001;
options.mongodb = options.mongodb || "mongodb://127.0.0.1/XSAppDB";
options.marketserver = options.marketserver || "http://203.67.19.128";
options.env = options.env || '';

var marketServer = new MarketServer(options.marketserver);
var appDB = new AppDB(options.mongodb, marketServer);

new WebServer(appDB, marketServer, options.port, options.env).run();
