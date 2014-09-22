/**
 * Created by Derek on 2014/9/19.
 */
"use strict";

var chai = require('chai');
var AppDB = require('../lib/appdb.js');
var fs = require('fs');
var url = 'mongodb://127.0.0.1/XSAppDB';
var marketserver = 'http://203.67.19.128';

describe("Test AppDB", function() {
    var appDB;

    before(function(done) {
        appDB = new AppDB({mongodb: url, marketserver: marketserver});
        appDB.on('ready', function(err) {
            done(err);
        });
    });

    it.skip("test add sensor", function(done) {
        var sensorList = [
            {
                guid: '88E9F01C-A4FD-4141-ACDF-142500F1774B',
                name: '元大上證指數ETF認售權證買進訊號',
                folder: '權證'
            }
        ];

        appDB.updateSensorList(sensorList, function(err, result) {
            getAllAppObj(done);
        });

    });

    it.skip("test add another sensor", function(done) {
        var sensorList = [
            {
                guid: '88E9F01C-A4FD-4141-ACDF-142500F1774B',
                name: '元大上證指數ETF認售權證買進訊號',
                folder: '權證'
            },
            {
                guid: 'CD678137-3323-425f-95D6-01280036D0E7',
                name: '午餐的奇襲賣出訊號',
                folder: '股票'
            }
        ];

        appDB.updateSensorList(sensorList, function(err, result) {
            getAllAppObj(done);
        });

    });

    it.skip("test update library", function(done) {
        var dsrfile = __dirname + "/../data/20140919.DSR";
        appDB.updateLibrary(appDB.LIBRARY_TYPE.DSR, dsrfile, function(err, result) {
            if (err != null) {
                console.log(err);
            }
            done();
        });
    });

    it.skip("test update library", function(done) {
        var dsrfile = __dirname + "/../data/20140919.xsb";
        appDB.updateLibrary(appDB.LIBRARY_TYPE.XSB, dsrfile, function(err, result) {
            if (err != null) {
                console.log(err);
            }
            done();
        });
    });

    it.skip("test get library", function(done) {
        var dsrfile = __dirname + "/../data/20140919-dup.DSR";
        appDB.getLibrary(appDB.LIBRARY_TYPE.DSR, function(err, library) {
            if (err != null) {
                console.log(err);
            }
            else if (library != null) {
                fs.writeFileSync(dsrfile, library.data);
            }
            done();
        });
    });

    it.skip("test get market itemlist", function(done) {
        appDB.getAppMarketItemList(function(err, itemList) {
            if (err != null) {
                console.log(err);
            }
            else {
                console.log(itemList);
            }
            done();
        });

    });

    it.skip("test setAppMarketItemExecId with invalid guid", function(done) {
        appDB.setAppMarketItemExecId('not existing id', 0, function(err, result) {
            console.log(err);
            done();
        });
    });

    it("test setAppMarketItemExecId with value guid", function(done) {
        appDB.setAppMarketItemExecId('88e9f01c-a4fd-4141-acdf-142500f1774b', 1, function(err, result) {
            console.log(err);
            done();
        });
    });

    function getAllAppObj(done) {
        appDB.getAllAppObj(function(err, appObjs) {
            console.log("getAllAppObj return:");
            console.log(appObjs);
            done();
        });
    }

});