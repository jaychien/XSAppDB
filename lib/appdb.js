/**
 * Created by Derek on 2014/9/19.
 */

/*
    var appDB = new AppDB(..);

    appDB.on('ready', function(err) { .. });

    appDB.updateSensorList(sensorList, cb);

    appDB.getAllAppObj(cb);
    appDB.updateAppObj(appObj, cb)

    appDB.updateLibrary(LIBRARAY_DSR, filename, cb);
    appDB.getLibrary(LIBRARAY_DSR, cb)
 */
"use strict";

var mongoose = require('mongoose');
var async = require('async');
var _ = require('underscore');
var fs = require('fs');
var iconv = require('iconv-lite');
var es = require('event-stream');
var moment = require('moment');
var util = require('util'),
    events = require('events');

var MarketServer = require('./marketserver.js');

var AppDB = function(options) {
    /*
        options.mongodb = MongoDB url, e.g. "mongodb://127.0.0.1/XSAppDB"
        options.marketserver = Market server 位置, e.g. "http://203.67.19.128/
     */
    var self = this;

    this.APPOBJ_TYPE = {
        SENSOR : 1,
        FILTER : 2
    };

    this.LIBRARY_TYPE = {
        XSB : 1,
        DSR : 2,
        DST : 3
    };

    this.startTime_default = 800;
    this.endTime_default = 1400;

    var _opt = options || {};

    _opt.mongodb = _opt.mongodb || "mongodb://127.0.0.1/XSAppDB";
    _opt.marketserver = _opt.marketserver || "http://203.67.19.128";

    var _marketServer = new MarketServer(_opt.marketserver);

    var _appSchema = mongoose.Schema({
        type: Number,       // 1: Sensor, 2: 選股
        guid: {type:String, unique:true}, // sensor的GUID
        name: String,       // sensor的名稱
        folder: String,     // sensor的目錄
        execId: Number,     // 0: 不執行, >0: 對應的執行機器代號
        startTime: {type:Number, default:self.startTime_default},   // HHmm (開始執行時間)
        endTime: {type:Number, default:self.endTime_default},       // HHmm (停止結束時間)
        deleted: Boolean,   // true: 已經刪除(新版DSR內已經不存在), 使用者必須去market執行下架的動作
        lastUpdated: Date   // 最後更新日期
    });

    _appSchema.methods.updateLastDate = function() {
        this.lastUpdated = new Date();
    };

    this.AppObj = mongoose.model('AppObj', _appSchema);

    var _librarySchema = mongoose.Schema({
        type: {type:Number, unique:true},       // 1: DSR, 2:XSB
        data: Buffer,
        lastUpdated: Date   // 最後更新日期
    });

    this.Library = mongoose.model('Library', _librarySchema);

    var _triggerSchema = mongoose.Schema({
        guid: {type:String},        // sensor的GUID
        triggerDate: Date,          // trigger的時間
        symbol: {type:String},      // 商品代碼
        price: {type:String}        // 價位
    });

    _triggerSchema.index({guid: 1, triggerDate: -1, symbol:1}, {unique: true});
    this.TriggerRecord = mongoose.model('TriggerRecord', _triggerSchema);

    // connect to server
    //
    mongoose.connect(_opt.mongodb);
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

            // 檢查手上的AppObj是否存在於import進來的sensor list內: 如果不存在, 表示已經沒有用了(要砍掉)
            // 如果存在的話, 則這是一個"舊的"sensor, 不需要新增
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
                        appObj.startTime = 0;
                        appObj.endTime = 0;
                    }
                    sensorList = _.without(sensorList, sensor);
                }
                else {
                    appObj.deleted = true;
                    appObj.execId = 0;
                    appObj.startTime = 0;
                    appObj.endTime = 0;
                }
                appObj.updateLastDate();
            });

            // 把這一次新增加的sensor加到appObj list內
            //
            _.each(sensorList, function(sensor) {
                var appObj = new self.AppObj({
                    type: self.APPOBJ_TYPE.SENSOR,
                    guid: sensor.guid,
                    name: sensor.name,
                    folder: sensor.folder,
                    execId: 0,
                    deleted: false,
                    startTime: self.startTime_default,
                    endTime: self.endTime_default,
                    lastUpdated: new Date()
                });
                appObjs.push(appObj);
            });

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

    // 上架狀態
    //
    this.MARKET_TYPE = {
        NONE: 0,        // 查不到
        OPEN: 1,        // 上架
        CLOSE: 2        // 下架
    };

    // AppObj 加上 上架的狀態
    //
    this.AppMarketItem = function(type, guid, name, folder, execId, startTime, endTime, deleted, marketId, marketStatus, subscriptionCount, triggerCount) {
        this.type = type;
        this.guid = guid;
        this.name = name;
        this.folder = folder;
        this.execId = execId;
        this.startTime = startTime;
        this.endTime = endTime;
        this.deleted = deleted;
        this.marketId = marketId;
        this.marketStatus = marketStatus;
        this.subscriptionCount = subscriptionCount;
        this.triggerCount = triggerCount;
    };

    /*
        getAppMarketItemList

        cb(err, items) where items is array of AppMarketItem

     */
    this.getAppMarketItemList = function(cb) {
        // 讀取DB內的AppObjs
        //
        self.AppObj.find(function(err, appObjs) {
            if (err != null) {
                cb(err, null);
            }
            else {
                // 取得subscription資料 + 最近7日的觸發記錄
                //
                async.parallel(
                    [
                        function(cb) {
                            _marketServer.getMarketItemsWithSubscription(cb);
                        },

                        function(cb) {
                            var dateEnd = new Date();
                            var dateStart = moment(dateEnd).subtract(7, 'days').toDate();

                            self.getRecentTriggerCount(dateStart, dateEnd, cb);
                        }
                    ],
                    function(err, results) {
                        if (err)
                            cb(err);
                        else {
                            cb(null, self.parseMarketItems(appObjs, results[0], results[1]));
                        }
                    }
                );

                /*
                _marketServer.getMarketItemsWithSubscription(function(err, result) {
                    if (err != null)
                        cb(err, null);
                    else {
                        var marketItemList = self.parseMarketItems(appObjs, result);
                        cb(null, marketItemList);
                    }
                });
                */
            }
        });
    };

    this.parseMarketItems = function(appObjs, marketList, triggerMap) {
        var marketMap = {};
        _.each(marketList, function(item) {
            marketMap[item.Guid.toLowerCase()] = item;
        });

        var itemList = [];

        // 先找deleted = false
        _.each(appObjs, function(appObj) {
            if (!appObj.deleted) {
                var item = marketMap[appObj.guid.toLowerCase()] || null;
                var marketId = 0;
                var marketStatus = 0;
                var subscriptionCount = 0;
                if (item == null) {
                    marketStatus = self.MARKET_TYPE.NONE;
                    marketId = 0;
                    subscriptionCount = 0;
                }
                else {
                    marketStatus = (item.Status == 1) ? self.MARKET_TYPE.OPEN : self.MARKET_TYPE.CLOSE;
                    marketId = item.ID;
                    subscriptionCount = item.SubscriptionCount;
                }

                var triggerCount = triggerMap[appObj.guid.toLowerCase()] || 0;

                itemList.push(new self.AppMarketItem(appObj.type, appObj.guid, appObj.name, appObj.folder, appObj.execId, appObj.startTime, appObj.endTime, false, marketId, marketStatus, subscriptionCount, triggerCount))
            }
        });

        // 找deleted = true
        //
        _.each(appObjs, function(appObj) {
            if (appObj.deleted) {
                var item = marketMap[appObj.guid] || null;
                if (item != null && item.Status == 1) {
                    itemList.push(new self.AppMarketItem(appObj.type, appObj.guid, appObj.name, appObj.folder, appObj.execId, appObj.startTime, appObj.endTime, true, item.ID, self.MARKET_TYPE.OPEN, 0, 0));
                }
            }
        });

        return itemList;
    };

    /*
         setAppMarketItemExecId
         - update MarketItem's execId value
     */
    this.setAppMarketItemExecId = function(guid, execId, cb) {
        self.AppObj.findOne({guid:guid}, function(err, appObj) {
            if (err != null)
                cb(err, null);
            else if (appObj == null) {
                cb('Cannot find guid:' + guid, null);
            }
            else {
                appObj.execId = execId;
                appObj.save(cb);
            }
        });
    };

    this.setAppMarketItemMarketStatus = function(guid, marketId, marketStatus, cb) {
        self.AppObj.findOne({guid:guid}, function(err, appObj) {
            if (err != null)
                cb(err, null);
            else if (appObj == null) {
                cb('Cannot find guid:' + guid, null);
            }
            else {
                // calling StrategyStore
                //
                if (marketId != 0) {
                    _marketServer.updateMarketItemStatus(guid, marketId, marketStatus, function(err, result) {
                        if (err != null)
                            cb(err, null);
                        else
                            cb(null, result);
                    });
                }
                else {
                    _marketServer.addMarketItem(guid, appObj.name, function(err, result) {
                        if (err != null)
                            cb(err, null);
                        else
                            cb(null, result);
                    });
                }
            }
        });
    };

    /*
        setAppMarketItemSchedule
        - update MarketItem's startTime/endTime value
     */
    this.setAppMarketItemSchedule = function(guid, startTime, endTime, cb) {
        self.AppObj.findOne({guid:guid}, function(err, appObj) {
            if (err != null)
                cb(err, null);
            else if (appObj == null) {
                cb('Cannot find guid:' + guid, null);
            }
            else {
                appObj.startTime = startTime;
                appObj.endTime = endTime;
                appObj.save(cb);
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

    // cb(err, result)
    //
    this.updateLibrary = function(type, filename, cb) {
        fs.readFile(filename, function(err, data) {
            if (err != null) {
                cb(err, null);
            }
            else {
                // to update via mongoose, either find() then save() on existing objects,
                // or use 'update' explicitly
                //
                self.Library.update({type:type}, {type: type, data: data, lastUpdated: new Date()}, {upsert:true}, cb);
            }
        });
    };

    // cb(err, result)
    //  result is the Library object
    //
    this.getLibrary = function(type, cb) {
        this.Library.findOne({type: type}, function(err, library) {
            cb(err, library);
        });
    };

    this.getLibraryFilename = function(type) {
        if (type == self.LIBRARY_TYPE.XSB) {
            return "script.xsb";
        }
        else if (type == self.LIBRARY_TYPE.DSR) {
            return "sensor.dsr";
        }
        else if (type == self.LIBRARY_TYPE.DST) {
            return "filter.dst";
        }
        else {
            return "";
        }
    };

    /**
     * Parse trigger檔案, 把結果寫入DB內
     * @param file trigger.txt檔案名稱
     * @param cb callback(err)
     */
    this.importTriggerFromFile = function(file, cb) {
        fs.createReadStream(file)
            .pipe(iconv.decodeStream('big5'))
            .pipe(es.split())
            .pipe(es.map(function(line, callback) {
                line = line.trim();
                if (line == '')
                    callback(null);
                else {
                    var tokens = line.split(',');
                    // tokens[0] = guid
                    // tokens[2] = date
                    // tokens[3] = symbol
                    // tokens[4] = price
                    //
                    var record = {guid:tokens[0].toLowerCase(), triggerDate:parseDate(tokens[2]), symbol:tokens[3], price:tokens[4]};
                    self.TriggerRecord.update(
                        {guid:record.guid, triggerDate:record.triggerDate, symbol:record.symbol},
                        record, {upsert:true}, callback);
                }
            }))
            .pipe(es.wait(function (err) {
                cb(err);
            }));
    };

    /**
     * Return a map (key=guid, value=count) of sensor trigger counts during dateStart/dateEnd
     *
     * @param dateStart 查詢開始日. dateStart <= dateEnd.
     * @param dateEnd 查詢結束日, dateStart <= dateEnd
     * @param cb callback(err, result), where result is a map(key = guid, value = count)
     */
    this.getRecentTriggerCount = function(dateStart, dateEnd, cb) {
        var map = {};

        var dateStartN = moment(dateStart).startOf('day').toDate();
        var dateEndN = moment(dateEnd).startOf('day').add('day', 1).toDate();

        var agg = [
            { $match: { "triggerDate" : {"$gte":dateStartN, "$lt":dateEndN}} },
            { $group: { _id: "$guid", count: {$sum: 1}} }
         ];

        self.TriggerRecord.aggregate(agg, function(err, result) {
            if (err)
                cb(err);

            var map = {};
            _.each(result, function(record) {
                map[record._id] = record.count;
            });

            cb(null, map);
        });

        /*
        self.TriggerRecord.find({"triggerDate" : {"$gte":dateStartN, "$lt":dateEndN}}, function(err, records) {
            if (err)
                cb(err);
            else {
                _.each(records, function(record) {
                    // group by record.guid
                    var count = map[record.guid] || 0;
                    count++;
                    map[record.guid] = count;
                });

                cb(null, map);
            }
        });
        */


    };

    function parseDate(datevalue) {
        // 20141118-90021 or 20141118-100021
        //
        var tokens = datevalue.split('-');
        if (tokens[1].length < 6) tokens[1] = '0' + tokens[1];

        return new moment(tokens.join('-'), "YYYYMMDD-HHmmss").toDate();
    }
};

util.inherits(AppDB, events.EventEmitter);

module.exports = AppDB;
