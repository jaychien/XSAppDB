/**
 * Created by Derek on 14/11/23.
 */

"use strict";

var FtpDownloader = require('../lib/ftpdownloader.js');
var Promise = require("bluebird");
var temp = require('temp');
var fs = require('fs');

describe("Test FtpDownloader", function() {

    it.skip("test valid server", function(done) {
        var ftp = new FtpDownloader();

        var server = "192.168.66.111";

        ftp.connect(server)
        .then(function() {
            console.log('connect to:' + server);
            return ftp.disconnect();
        })
        .then(function() {
            console.log('disconnect from:' + server);
        })
        .catch(function(err) {
            console.log('Error:' + err);
        })
        .finally(function() {
            done();
        });
    });

    it.skip("test invalid user", function(done) {
        var ftp = new FtpDownloader();

        var server = "192.168.66.111";

        ftp.connect(server, null, "user", "pass")
        .then(function() {
            console.log('connect to:' + server);
            return ftp.disconnect();
        })
        .then(function() {
            console.log('disconnect from:' + server);
        })
        .catch(function(err) {
            console.log('Error:' + err);
        })
        .finally(function() {
            done();
        });
    });

    it.skip("test download", function(done) {
        var ftp = new FtpDownloader();

        var server = "192.168.66.111";
        var remoteFile = "/XMLFILE/20141118/SensorTrigger.txt";
        var localFile = temp.path({suffix : '.tmp'});

        ftp.connect(server)
        .then(function() {
            console.log('connect to:' + server);
            return ftp.download(remoteFile, localFile, false);
        })
        .then(function(data) {
            console.log('Download File:' + data + ' to local:' + localFile);
            return ftp.disconnect();
        })
        .then(function() {
            console.log('disconnect from:' + server);
        })
        .catch(function(err) {
            console.log('Error:' + err);
        })
        .finally(function() {
            done();
        });
    });

});
