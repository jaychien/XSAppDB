/**
 * Created by Derek on 14/11/24.
 */

/*
    Provide API to import Trigger file
    - daily import (as background schedule)
    - manual import
 */

"use strict";

var FtpDownloader = require('./ftpdownloader.js');
var fs = require('fs');
var temp = require('temp');
var logger = require('./logger.js').getLogger('[triggerimport]');
var moment = require('moment');
var Promise = require('bluebird');

/**
 * Create TriggerImportSvc object
 * @param appDB appDB instance
 * @param options contains the following property:
 * server: ftp server IP, mandatory
 * port: ftp port, optional
 * user: ftp user, optional. Pass null for anonymous login
 * pass: ftp password, optional. Pass null for anonymous login
 * schedule: array of HHMMSS. Will automatically execute an import task at the specified time (daily)
 * @constructor
 */
var TriggerImportSvc = function(appDB, options) {
    var self = this;

    self.options = options || {};
    self.options.server = self.options.server || '';
    self.options.port = self.options.port || null;
    self.options.user = self.options.user || null;
    self.options.pass = self.options.pass || null;

    // TODO: schedule

    self.ftpclient = new FtpDownloader();

    /**
     * Execute a import task. Return a promise that resolves when done.
     * @param date which Date to import.
     */
    self.importTrigger = function(date) {
        var remotePath = '/XMLFILE/' + moment(date).format('YYYYMMDD') + '/SensorTrigger.txt';
        var localPath = temp.path({suffix: 'tmp'});

        return self.ftpclient.connect(self.options.server, self.options.port, self.options.user, self.options.pass)
            .then(function() {
                return self.ftpclient.download(remotePath, localPath);
            })
            .then(function() {
                return new Promise(function(resolve, reject) {
                    appDB.importTriggerFromFile(localPath, function(err, data) {
                        if (err)
                            reject(err);
                        else
                            resolve();
                    });
                });
            })
            .then(function() {
                fs.unlinkSync(localPath);
                return self.ftpclient.disconnect();
            })
    };

};

module.exports = TriggerImportSvc;
