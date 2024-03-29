/**
 * Created by Derek on 2014/9/18.
 */

/*
 Global logger object

 var logger = require('./lib/logger.js').getLogger('[moduleName]');

 logger.debug('...');
 logger.info('...');

 */

var log4js = require('log4js');

log4js.configure({
    appenders: [
        { type: 'console' }
    ]
});

// singleton instance
//
module.exports = exports = log4js;
