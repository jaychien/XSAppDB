/**
 * Created by Derek on 2014/9/18.
 */

var fs = require('fs');
var temp = require('temp');
var path = require('path');
var express = require('express');
var multer  = require('multer');
var logger = require('./logger.js').getLogger('[web]');

var WebServer = function(appDB, options) {
    var self = this;

    /*
        options.port
     */

    options = options || {};
    options.port = options.port || 7001;

    var app = express();

    var webFolder = __dirname + '/../web';

    app.use(express.static(webFolder));
    app.use(multer({ dest: './upload/'}));

    this.run = function() {
        app.listen(options.port);
    };

    app.get('/download/:type', function(req, res) {
        var type = req.param("type");
        logger.debug("/download/type=" + type);
        returnLibrary(type, res);
    });

    function returnLibrary(type, res) {
        appDB.getLibrary(type, function(err, library) {
            if (err != null) {
                res.status(500).send(err.toString());
            }
            else if (library == null) {
                res.status(404).send("cannot find library data");
            }
            else {
                res.setHeader('Content-disposition', 'attachment; filename=' + appDB.getLibraryFilename(type));
                res.setHeader('Content-type', "application/octet-stream");
                res.send(library.data);
            }
        });
    }

};

module.exports = WebServer;
