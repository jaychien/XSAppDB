/**
 * Created by Derek on 2014/9/18.
 */

var AppDB = require('./lib/appdb.js');
var MarketServer = require('./lib/marketserver.js');
var TriggerImportSvc = require('./lib/triggerimportsvc.js');
var options = require('./lib/config.json');
var WebServer = require('./lib/webserver.js');

options = options || {};
options.port = options.port || 7001;
options.mongodb = options.mongodb || "mongodb://127.0.0.1/XSAppDB";
options.marketserver = options.marketserver || "http://203.67.19.128";
options.env = options.env || '';
options.triggerimport = options.triggerimport || {};
    options.triggerimport.server = options.triggerimport.server || "127.0.0.1";

var marketServer = new MarketServer(options.marketserver);
var appDB = new AppDB(options.mongodb, marketServer);
var triggerImportSvc = new TriggerImportSvc(appDB, options.triggerimport);

new WebServer(appDB, marketServer, triggerImportSvc, options.port, options.env).run();
