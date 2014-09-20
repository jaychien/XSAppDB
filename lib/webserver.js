/**
 * Created by Derek on 2014/9/18.
 */

var fs = require('fs');
var temp = require('temp');
var path = require('path');
var express = require('express');
var multer  = require('multer');
var logger = require('./logger.js').getLogger('[web]');

var WebServer = function(options) {
    var self = this;

    var serverConfig = options.server || { port: 7000 };
    var app = express();

    var webFolder = __dirname + '/../web';

    app.use(express.static(webFolder));
    app.use(multer({ dest: './upload/'}));

    this.run = function() {
        app.listen(serverConfig.port);
    };

};

module.exports = WebServer;
