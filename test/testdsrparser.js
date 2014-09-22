/**
 * Created by Derek on 2014/9/20.
 */

var DSRParser = require('../lib/dsrparser.js');

describe("Test DSRParser", function() {
    it("test", function(done) {
        var dsr = __dirname  + '/20140919.DSR';
        DSRParser.parseDSR(dsr, function(err, result) {
            if (err != null) {
                console.log(err);
            }
            else {
                console.log(result);
            }
            done();
        });
    });
});
