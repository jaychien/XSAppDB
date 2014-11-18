/**
 * Created by Derek on 14/11/18.
 */

var MarketServer = require('../lib/marketserver.js');
var marketServer = new MarketServer('http://sd-vdisc02/StoreSvc/');

describe("Test MarketParser", function() {

    it.skip("test getMarketSubscription", function(done) {
        marketServer.getMarketSubscription(function(err, result) {
            if (err)
                throw err;

            console.log(result);
            done();
        });
    });

    it.skip("test getMarketItem", function(done) {
        marketServer.getMarketItems(function(err, result) {
            if (err)
                throw err;

            console.log(result);
            done();
        });
    });

    it.skip("test getMarketItemsWithSubscription", function(done) {
        marketServer.getMarketItemsWithSubscription(function(err, result) {
            if (err)
                throw err;

            console.log(result);
            done();
        });
    });
});