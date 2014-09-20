/**
 * Created by Derek on 2014/9/20.
 */

var _ = require('underscore');
var logger = require('./logger.js').getLogger('[ScheduleDB]');
var fs = require('fs');
var temp = require('temp');
var procrunner = require('./procrunner.js');
require('date-utils');

/*
    scheduleDB = new ScheduleDB(
 */
var ScheduleDB = function() {
    this.Schedule = function(name, guid, startTime, endTime, priority) {
        this.name = name;
        this.guid = guid;
        this.runType = 0;
        this.status = 0;
        this.startTime = startTime;
        this.endTime = endTime;
        this.createDate = new Date().toFormat("YYYY-MM-DD HH24:MI:SS");
        this.priority = priority;
    };

    this.genScheduleDB = function(scheduleList, outputFileName, cb) {
        // create a json file with scheduleList
        // call genscheduledb.py
        // remove the json file
        //
        var tmpName = temp.path({suffix:'json'});
        logger.debug('wrint to:' + tmpName);
        fs.writeFileSync(tmpName, JSON.stringify(scheduleList), {encoding:'utf8'});

        procrunner.run('python', [__dirname + "/../bin/genscheduledb.py", tmpName, outputFileName], function(err, output) {
            if (err != null) {
                logger.error(err);
            }

            logger.debug(output);

            // TODO: delete tmpName

            cb(err, '');
        });

    };
};

module.exports = new ScheduleDB();
