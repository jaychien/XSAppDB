/**
 * Created by Derek on 14/11/24.
 */

"use strict";

var TriggerImportSvc = require('../lib/triggerimportsvc.js');
var AppDB = require('../lib/appdb.js');
var MarketServer = require('../lib/marketserver.js');
var moment = require('moment');
var Promise = require('bluebird');

var url = 'mongodb://127.0.0.1/XSAppDB';
var marketserver = 'http://203.67.19.127/StoreSvc/';
var ftpserver = '192.168.66.111';

describe("Test TriggerImportSvc", function() {
    var appDB;

    before(function(done) {
        appDB = new AppDB(url, new MarketServer(marketserver));
        appDB.on('ready', function(err) {
            done(err);
        });
    });

    it.skip("test import", function(done) {
        var svc = new TriggerImportSvc(appDB, {server:ftpserver});

        var date = moment('20141118', "YYYYMMDD");
        svc.importTrigger(date)
            .then(function() {
                console.log('done !!');
            })
            .catch(function(err) {
                console.log('Import Err=' + err);
            })
            .finally(function() {
                done();
            })
    });
});