/**
 * Created by Derek on 2014/9/18.
 */

console.log("index.js");

var options = require('./lib/config.json');
var WebServer = require('./lib/webserver.js');

new WebServer(options).run();
