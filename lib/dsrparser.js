/**
 * Created by Derek on 2014/9/19.
 */

var _ = require('underscore');
var spawn = require('child_process').spawn;
var logger = require('./logger.js').getLogger('[DSRParser]');

var DSRParser = function() {
    /*
        cb(err, result)

        result is an array of Sensor object
        [
            { 'guid':.., 'name':.., 'folder':.. }
        ]
     */
    var self = this;
    this.Sensor = function(guid, name, folder) {
        this.guid = guid;
        this.name = name;
        this.folder = folder;
    };

    this.parseDSR = function(filename, cb) {
        var result = '';
        var proc = spawn('python',[
                __dirname + "/../bin/dumpdsr.py",
            filename
        ]);

        proc.on('error', function(err) {
            logger.error(err);
            cb(err, null);
        });

        proc.stdout.on('data', function(data) {
            result += data;
        });

        proc.on('close', function(code) {
            if (code != 0) {
                var errMsg = 'execution error:' + code;
                logger.error(errMsg);
                cb(errMsg, null);
            }
            else {
                var sensorList = parseDSRDump(result);
                cb(null, sensorList);
            }
        });
    };

    function parseDSRDump(result) {
        var sensorList = [];

        var lines = result.split('\n');

        _.each(lines, function(line) {
            line = line.trim();
            if (line.length > 0) {
                var fields = line.split(',');
                var sensor = new self.Sensor(fields[0], fields[1], fields[2]);
                sensorList.push(sensor);
            }
        });
        return sensorList;
    }
};

module.exports = new DSRParser();
