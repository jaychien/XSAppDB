/**
 * Created by Derek on 2014/9/18.
 */
"use strict";

var fs = require('fs');
var path = require('path');
var DSRParser = require('../lib/dsrparser.js');
var ScheduleDB = require('../lib/scheduledb.js');
var express = require('express');
var multer  = require('multer');
var logger = require('./logger.js').getLogger('[web]');
var async = require('async');
var morgan = require('morgan');
var temp = require('temp');
var _ = require('underscore');

var WebServer = function(appDB, port) {
    var self = this;

    var app = express();

    var webFolder = __dirname + '/../web';

    app.use(express.static(webFolder));
    app.use(multer({ dest: './upload/'}));
    app.use(morgan('common'));

    this.run = function() {
        app.listen(port);
    };

    /*
        /api/download/n => 下載library (type=n) (as attachment)
        /api/upload/n => 上傳library (type=n)
        /api/downloadschedule/n => 下載執行主機(n)的排程資料

        /api/applist => 回傳策略清單
        /api/setappexecid?guid=..&execId=.. => 修改某個策略的執行主機資料

        /api/getlibrary/n => 下載library (type=n) as binary data
        /api/getschedule/n => 下載執行主機(n)的排程資料 as binary data
     */

    app.get('/api/download/:type', function(req, res) {
        var type = req.param("type");
        if (type != appDB.LIBRARY_TYPE.DSR && type != appDB.LIBRARY_TYPE.XSB) {
            res.status(404).send('Invalid library type:' + type);
        }
        else {
            returnLibrary(type, res, true);
        }
    });

    app.get('/api/getlibrary/:type', function(req, res) {
        var type = req.param("type");
        if (type != appDB.LIBRARY_TYPE.DSR && type != appDB.LIBRARY_TYPE.XSB) {
            res.status(404).send('Invalid library type:' + type);
        }
        else {
            returnLibrary(type, res, false);
        }
    });

    app.post('/api/upload/:type', function(req, res) {
        var type = req.param("type");
        var file = req.files['file_' + type.toString()];

        if (type == appDB.LIBRARY_TYPE.XSB) {
            procXSBUpload(file, req, res);
        }
        else if (type == appDB.LIBRARY_TYPE.DSR) {
            procDSRUpload(file, req, res);
        }
        else {
            res.status(500).send('unsupported library type:' + type);
            file.unlink(file.path);
        }
    });

    // Return app object listing (as an array)
    // { type:1, guid: .., name: .., folder: .., execId: .., deleted: .., market: ..}
    //
    //  - market = 0: 未上架, 1: 上架, 2: 下架
    //  - deleted = true的只顯示 market=1的case
    //  - 先show deleted = false, 然後show deleted = true
    //
    app.get('/api/applist', function(req, res) {
        appDB.getAppMarketItemList(function(err, itemList) {
            if (err != null) {
                res.status(500).send("錯誤:" + err);
            }
            else {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(itemList));
            }
        });
    });

    app.get('/api/setappexecid', function(req, res) {
        var guid = req.param("guid") || '';
        var execId = req.param("execId") || '';

        if (guid == null || execId == null) {
            res.status(500).send('Missing guid/execId parameter');
        }
        else {
            appDB.setAppMarketItemExecId(guid, execId, function(err, appObj) {
                if (err != null) {
                    res.status(500).send('Update DB err=' + err);
                }
                else {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({}));
                }
            });
        }
    });

    app.get('/api/downloadschedule/:execId', function(req, res) {
        var execId = req.param("execId") || '';
        if (execId == null) {
            res.status(404).send('Missing execId');
        }
        else {
            procGenScheduleDB(execId, res, true);
        }
    });

    app.get('/api/getschedule/:execId', function(req, res) {
        var execId = req.param("execId") || '';
        if (execId == null) {
            res.status(404).send('Missing execId');
        }
        else {
            procGenScheduleDB(execId, res, false);
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
            if (err != null) {
                res.status(500).send('儲存XSB時發生錯誤:' + err);
            }
            else {
                res.status(200).send('');
            }
            fs.unlink(file.path);
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
                    if (err != null) {
                        res.status(500).send('更新AppDB資料庫時發生錯誤:' + err);
                    }
                    else {
                        res.status(200).send('');
                    }

                    fs.unlink(file.path);
                });
            }
        });
    }

    function returnLibrary(type, res, asAttachment) {
        appDB.getLibrary(type, function(err, library) {
            if (err != null) {
                res.status(500).send(err.toString());
            }
            else if (library == null) {
                res.status(404).send("cannot find library data");
            }
            else {
                if (asAttachment)
                    res.setHeader('Content-disposition', 'attachment; filename=' + appDB.getLibraryFilename(type));

                res.setHeader('Content-type', "application/octet-stream");
                res.send(library.data);
            }
        });
    }

    function procGenScheduleDB(execId, res, asAttachment) {
        var startTime = "08:00";
        var endTime = "14:30";

        // TODO: 這個應該獨立出去
        //
        appDB.getAllAppObj(function(err, appObjs) {
            if (err != null) {
                res.status(500).send('Query DB error=' + err);
            }
            else {
                var scheduleList = [];
                var priority = 0;
                _.each(appObjs, function(appObj) {
                    if (!appObj.deleted && appObj.type == appDB.APPOBJ_TYPE.SENSOR && appObj.execId == execId) {
                        scheduleList.push(new ScheduleDB.Schedule(appObj.name, appObj.guid, startTime, endTime, priority));
                        priority = priority + 1;
                    }
                });

                var tempFile = temp.path({suffix : '.db'});
                ScheduleDB.genScheduleDB(scheduleList, tempFile, function(err, result) {
                    if (err != null) {
                        res.status(500).send('Generate ScheduleDB err=' + err);
                    }
                    else {
                        if (asAttachment) {
                            res.setHeader('Content-disposition', 'attachment; filename=' + 'XSSchedule.db');
                        }

                        res.setHeader('Content-type', "application/octet-stream");
                        var filestream = fs.createReadStream(tempFile);
                        filestream.pipe(res);
                        filestream.on('end', function() {
                            fs.unlink(tempFile);
                        });
                    }
                });
            }
        });
    }
};

module.exports = WebServer;
