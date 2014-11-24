/**
 * Created by Derek on 14/11/23.
 */


/*
    A simple ftp client to download a single file from ftp server


    var ftp = new FtpDownloader();
    ftp.connect({server:.., port:.., user:.., pass:..}}
    .then(function() {
        return ftp.download('remotepath', 'localpath');
    })
    .then(function(remotePath) {
        // download remotePath complete


        return ftp.disconnect();
    })
    .catch(function(err) {
    });
    .finally(function(..) {
    });
 */
"use strict";

var Ftp = require("jsftp");
var Promise = require("bluebird");
var fs = require("fs");
var temp = require('temp');

var FtpDownloader = function() {

    var self = this;

    /**
     * Connect to a ftp server. Return a promise that resolves when connected.
     * @param options Object with the following properties: host (mandatory), port(optional), user(optional), pass(optional).
     * @param server ftp server location.
     * @param port ftp server port. Optional.
     * @param user user id to connect. Pass null for anonymous login.
     * @param pass user password to connect. Pass null for anonymous login.
     * @returns {Promise}
     */
    self.connect = function(server, port, user, pass) {

        return new Promise(function(resolve, reject) {

            var options = { host: server};
            if (port) options.port = port;
            if (user) options.user = user;
            if (pass) options.pass = pass;

            self.ftp = new Ftp(options);
            self.ftp.on('error', function(err) {
                reject(err);
            });

            self.ftp.on('timeout', function(err) {
                reject(err);
            });

            self.ftp.auth(options.user || null, options.pass || null, function(err, data) {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    };

    /**
     * Download a file and save it to a local file. Return a promise that resolves to remotePath (string) when download completes.
     * @param remotePath remote file (source)
     * @param localPath local file (destination)
     */
    self.download = function(remotePath, localPath) {
        return new Promise(function(resolve, reject) {
            self.ftp.get(remotePath, localPath, function(err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(remotePath);
                }
            });
        });
    };

    /**
     * Disconnect from server.
     * @returns {Promise}
     */
    self.disconnect = function() {
        return new Promise(function(resolve, reject) {
            if (!self.ftp) {
                reject('connect is not called');
                return;
            }

            self.ftp.raw.quit(function(err, data) {
                if (err) {
                    reject(err);
                }
                else {
                    self.ftp = null;
                    resolve();
                }
            });
        });
    };

};

module.exports = FtpDownloader;
