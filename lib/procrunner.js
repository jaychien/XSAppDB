/**
 * Created by Derek on 2014/9/20.
 */

"use strict";

var spawn = require('child_process').spawn;

var ProcRunner = function() {

    /*
        cb(err, output)
     */
    this.run = function(procName, args, cb) {
        var result = '';
        var proc = spawn(procName, args);

        proc.on('error', function(err) {
            cb(err, null);
        });

        proc.stdout.on('data', function(data) {
            result += data;
        });

        proc.on('close', function(code) {
            if (code != 0) {
                cb('execution error:' + code, null);
            }
            else {
                cb(null, result);
            }
        });
    }
};

module.exports = new ProcRunner();
