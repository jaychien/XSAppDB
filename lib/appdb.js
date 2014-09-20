/**
 * Created by Derek on 2014/9/19.
 */

/*
    var appDB = new AppDB(..);

    appDB.on('ready', function(err) { .. });

    appDB.updateSensorList(sensorList, cb);

    appDB.getAllAppObj(cb);
    appDB.updateAppObj(appObj, cb)

    appDB.updateRawData({"DSR":.., "XSB":..}, cb)
    appDB.getDSRData(cb)
    appDB.getXSBData(cb)
 */

var mongoose = require('mongoose');
var async = require('async');
var _ = require('underscore');
var util = require('util'),
    events = require('events');

var AppDB = function(options) {
    /*
        options.url = MongoDB url, e.g. "mongodb://127.0.0.1/XSAppDB"
     */
    var self = this;
    var _opt = options || {};

    var TYPE_SENSOR = 1;
    var TYPE_FILTER = 2;

    _opt.url = _opt.url || "mongodb://127.0.0.1/XSAppDB";

    var _appSchema = mongoose.Schema({
        type: Number,       // 1: Sensor, 2: 選股
        guid: { type:'string', unique:true }, // sensor的GUID
        name: String,       // sensor的名稱
        folder: String,     // sensor的目錄
        execId: Number,     // 0: 不執行, >0: 對應的執行機器代號
        deleted: Boolean,   // true: 已經刪除(新版DSR內已經不存在), 使用者必須去market執行下架的動作
        lastUpdated: Date   // 最後更新日期
    });

    _appSchema.methods.updateLastDate = function() {
        this.lastUpdated = new Date();
    };

    this.AppObj = mongoose.model('AppObj', _appSchema);

    // connect to server
    //
    mongoose.connect(_opt.url);
    mongoose.connection.on('error', function(err) {
        self.emit('ready', err);
    });

    mongoose.connection.once('open', function() {
        self.emit('ready', null);
    });

    // Update AppObj status
    //  - add/remove sensor objects
    //
    this.updateSensorList = function(sensorList, cb) {
        function parseAppObjs(appObjs) {
            // scan appObjs:
            // - 找出不在sensorList裡面的, 把這些appObj標記成deleted
            // - 同時把有對應到的sensor從sensorList內拿掉
            //
            _.each(appObjs, function(appObj) {
                var sensor = _.find(sensorList, function(s) {
                    return s.guid == appObj.guid;
                });

                if (sensor != null) {
                    appObj.name = sensor.name;
                    appObj.folder = sensor.folder;

                    if (appObj.deleted) {
                        appObj.deleted = false;
                        appObj.execId = 0;
                    }
                    sensorList = _.without(sensorList, sensor);
                }
                else {
                    appObj.deleted = true;
                    appObj.execId = 0;
                }
                appObj.updateLastDate();
            });

            _.each(sensorList, function(sensor) {
                var appObj = new self.AppObj({
                    type: TYPE_SENSOR,
                    guid: sensor.guid,
                    name: sensor.name,
                    folder: sensor.folder,
                    execId: 0,
                    deleted: false,
                    lastUpdated: new Date()
                });
                appObjs.push(appObj);
            });

            console.log(appObjs);

            var tasks = _.map(appObjs, function(appObj) {
                return function(cb) {
                    appObj.save(cb);
                }
            });

            async.parallel(tasks, cb);
        }

        self.AppObj.find(function(err, appObjs) {
            if (err != null) {
                cb(err, null);
            }
            else {
                parseAppObjs(appObjs);
            }
        });
    };

    // cb(err, appObjs)
    //  - appObjs is array of AppObj
    //
    this.getAllAppObj = function(cb) {
        self.AppObj.find(cb);
    };

    // cb(err, appObj)
    //  - appObj is the updated object
    //
    this.updateAppObj = function(appObj, cb) {
        appObj.updateLastDate();
        appObj.save(cb);
    };

};

util.inherits(AppDB, events.EventEmitter);

module.exports = AppDB;
