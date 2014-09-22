/**
 * Created by Derek on 2014/9/18.
 */
"use strict";

var fs = require('fs');
var path = require('path');
var DSRParser = require('../lib/dsrparser.js');
var express = require('express');
var multer  = require('multer');
var logger = require('./logger.js').getLogger('[web]');
var async = require('async');

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


    app.post('/upload/:type', function(req, res) {
        var type = req.param("type");
        logger.debug("/upload/type=" + type);

        var file = req.files['file_' + type.toString()];

        try {
            if (type == appDB.LIBRARY_TYPE.XSB) {
                procXSBUpload(file, req, res);
            }
            else if (type == appDB.LIBRARY_TYPE.DSR) {
                procDSRUpload(file, req, res);
            }
            else {
                res.status(500).send('unsupported library type:' + type);
            }
        }
        finally {
            // fs.unlink(file.path);    // remove upload file
        }
    });

    // global error handling
    //
    app.use(function(err, req, res, next) {
        logger.info('Error request[' + req.url + '] Err=[' + err.toString() + ']');
        logger.info(err.stack || '');

        res.status(500).send('Internal error occurred.');
    });

    function procXSBUpload(file, req, res) {
        appDB.updateLibrary(appDB.LIBRARY_TYPE.XSB, file.path, function(err, result) {
            // TODO: 目前上傳成功後直接redirect to caller
            if (err != null) {
                res.status(500).send('儲存XSB時發生錯誤:' + err);
            }
            else {
                var backURL = req.header('Referer') || '/';
                res.redirect(backURL);
            }
        });
    }

    function procDSRUpload(file, req, res) {
        // 先parse DSR的內容
        //
        var filepath = file.path;
        logger.debug('handle DSR:' + filepath);

        DSRParser.parseDSR(filepath, function(err, sensorList) {
            if (err != null) {
                res.status(500).send('解析DSR檔案時發生錯誤:' + err);
            }
            else {
                logger.debug("Upload sensor list");
                logger.debug(sensorList);

                async.parallel([
                    function(cb) {
                        appDB.updateSensorList(sensorList, cb);
                    },

                    function(cb) {
                        appDB.updateLibrary(appDB.LIBRARY_TYPE.DSR, filepath, cb);
                    }
                ],
                function(err, results) {
                    // TODO: 目前上傳成功後直接redirect to caller
                    if (err != null) {
                        res.status(500).send('更新AppDB資料庫時發生錯誤:' + err);
                    }
                    else {
                        var backURL = req.header('Referer') || '/';
                        res.redirect(backURL);
                    }
                });
            }
        });
    }

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
