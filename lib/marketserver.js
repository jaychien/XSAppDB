/**
 * Created by Derek on 2014/10/1.
 */

var request = require('request');

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
                cb(err, null);
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
    }

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

};

module.exports = MarketServer;

