/**
 * Created by Derek on 2014/9/20.
 */

var scheduledb = require('../lib/scheduledb.js');
var fs = require('fs');

describe("Test ScheduleDB", function() {
    it.skip("test generate data", function(done) {

        var scheduleList = [];
        scheduleList.push(
            new scheduledb.Schedule("台積電大單買進對應買權買進訊號", "E1718FDD-E721-4a03-B06F-E7AA86D88435", "08:30", "14:30", 0));

        scheduleList.push(
            new scheduledb.Schedule("台積電大單賣出對應賣權買進訊號", "C9A0A669-FA52-4dae-B531-E906C3638D01", "08:30", "14:30", 1));

        var outputName = __dirname + '/result.sqlite';
        if (fs.existsSync(outputName))
            fs.unlinkSync(outputName);

        scheduledb.genScheduleDB(scheduleList, outputName, function(err, result) {
            if (err != null) {
                console.log(err);
            }
            done();
        });
    });
});
