#!/usr/local/bin/node
/*
    $ importtrigger.js [--mongodb=mongodb://127.0.0.1/XSAppDB] --file=SensorTrigger.txt

 */
var AppDB = require('../lib/appdb.js');

var argv = require('minimist')(process.argv.slice(2));

function usage() {
    process.stdout.write('Usage\n');
    process.stdout.write('importtrigger.js [--mongodb=mongodb://127.0.0.1/XSAppDB] --file=SensorTrigger.txt\n');
}

var mongodb = argv["mongodb"] || '';
if (mongodb == '')
    mongodb = 'mongodb://127.0.0.1/XSAppDB';

var file = argv["file"] || '';
if (file == '') {
    usage();
    process.exit(1);
}

var appDB = new AppDB({mongodb:mongodb});
appDB.on('ready', function() {
    appDB.importTriggerFromFile(file, function(err) {
        if (err) {
            process.stdout.write('Error:' + err + '\n');
            process.exit(1);
        }
        else {
            process.stdout.write('Converted.\n');
            process.exit(0);
        }
    });
});
