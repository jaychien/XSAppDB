/**
 * Created by Derek on 2014/9/19.
 */

"use strict";
var _ = require('underscore');
var logger = require('./logger.js').getLogger('[DSRParser]');
var procrunner = require('./procrunner.js');

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
        var args = [__dirname + "/../bin/dumpdsr.py", filename];
        logger.debug('parseDSR run:' + args);
        procrunner.run('python', args,
            function(err, result) {
                if (err != null) {
                    logger.error(err);
                    cb(err, null);
                }
                else {
                    cb(null, parseDSRDump(result));
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
                // convert guid to lower-case
                //
                var sensor = new self.Sensor(fields[0].toLowerCase(), fields[1], fields[2]);
                sensorList.push(sensor);
            }
        });
        return sensorList;
    }
};

module.exports = new DSRParser();
