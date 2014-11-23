/**
 * Created by Derek on 2014/10/1.
 */

var request = require('request');
var _ = require('underscore');
_.str = require('underscore.string');
_.mixin(_.str.exports());
_.str.include('Underscore.string', 'string');

var async = require('async');

var MarketServer = function(server) {

    var self = this;

    /*
        取得目前market上面物件的清單

        cb(err, result)

        result is a list of market items
     */
    this.getMarketItems = function(cb) {
        var url = server + "api/strategies/digest?appid=DAQ&format=json&validonly=false";
        request(url, function(error, response, body) {
            if (error != null) {
                cb(error);
            }
            else if (response.statusCode != 200) {
                cb('Calling MarketServer return:' + response.statusCode, null);
            }
            else {
                cb(null, JSON.parse(body));
            }
        });
    };

    /*
        取得目前market上面物件的訂閱紀錄

        cb(err, result)

        result is a list of { 'ID': 16, 'Count': 128 }

        ID是策略的內部ID, 非guid
     */
    this.getMarketSubscription = function(cb) {
        var url = server + "api/subscriptions?appid=DAQ&format=json";

        request(url, function(error, response, body) {
            if (error != null) {
                cb(err, null);
            }
            else if (response.statusCode != 200) {
                cb('Calling MarketServer return:' + response.statusCode, null);
            }
            else {
                cb(null, self.summarizeSubscriptionData(JSON.parse(body)));
            }
        });
    };

    /*
        取得market上面的所有物件, 以及subscription的紀錄
     */
    this.getMarketItemsWithSubscription = function(cb) {
        async.parallel(
            [
                function(cb) {
                    self.getMarketItems(cb);
                },
                function(cb) {
                    self.getMarketSubscription(cb);
                }
            ],
            function(err, results) {
                if (err)
                    cb(err);
                else {
                    cb(null, self.mergeMarketItemWithSubscription(results[0], results[1]));
                }
            }
        );

    };

    /*
        新增一個物件 (上架)
     */
    this.addMarketItem = function(guid, name, cb) {
        var url = server + "api/strategies";

        var item = {
            AppID: "DAQ",
            AuthorID : "sysjust",
            Guid : guid,
            Name : name,
            ShortDesc : "TODO...",
            Description : "TODO...",
            Status : 1,
            Type : 1
        };

        request.post(url,
            {
                headers: {
                    'content-type': 'application/json'
                },
                body: JSON.stringify(item)
            },
            function(error, response, body) {
                if (error != null) {
                    cb(err, null);
                }
                else if (response.statusCode < 200 || response.statusCode > 299) {
                    // Note 2xx are all accepted. REST server might return 201 CREATED
                    //
                    cb('Calling MarketServer return:' + response.statusCode, null);
                }
                else {
                    cb(null, JSON.parse(body));
                }
            });
    };

    /*
        修改物件上下架的狀態
     */
    this.updateMarketItemStatus = function(guid, marketId, status, cb) {
        var url = server + "api/strategies/" + marketId;
        var item = {
            ID: marketId,
            AppID: "DAQ",
            AuthorID : "sysjust",
            Status : status
        };

        request.patch(url,
            {
                headers: {
                    'content-type': 'application/json'
                },
                body: JSON.stringify(item)
            },
            function(error, response, body) {
                if (error != null) {
                    cb(err, null);
                }
                else if (response.statusCode < 200 || response.statusCode > 299) {
                    // Note 2xx are all accepted. REST server might return 201 CREATED
                    //
                    cb('Calling MarketServer return:' + response.statusCode, null);
                }
                else {
                    cb(null, JSON.parse(body));
                }
            });
    };

    this.summarizeSubscriptionData = function(data) {
        /*
            data is list of
            {
                AppID: "DAQ",
                UserID: "661",
                StrategyID: 148,
                OrderTime: "2014-10-23T14:22:00"
            }

            group by StrategyID, 找到每個 StrategyID 的count

         */

        var summary = _.countBy(data, function(item) {
            if (self.isInternalUserID(item))
                return "-1";
            else
                return item.StrategyID;
        });

        return _.map(summary, function(value, key) {
            return {ID: parseInt(key), Count: value};
        })
    };

    this.mergeMarketItemWithSubscription = function(marketItemList, subscriptList) {
        /*
            marketItemList = array of {ID: 146, Guid: .., Name:.., Status: "0" }
            subscriptList = { 'ID': 16, 'Count': 128 }
         */
        return _.map(marketItemList, function(marketItem) {
            var subscription = _.find(subscriptList, function(item) {
                return marketItem.ID == item.ID;
            });
            marketItem.SubscriptionCount = (subscription ? subscription.Count : 0) || 0;
            return marketItem;
        });
    };

    this.isInternalUserID = function(item) {
        return _(item.UserID).startsWith('Inhouse-') ||
               _(item.UserID).startsWith('Justb-');
    }
};

module.exports = MarketServer;

