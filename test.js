// TEST CASE

var logger = require('./');
var log = new logger('mylog', { dir: 'd:/log' });

// String
log.done('some info message ...');

// String format
log.info('hello %s', 'world');

// Object
log.trace({ item: 'test' });

// Object and string
log.warn({ item: 'test' }, 'hello %s', 'world');

// Error Object
log.error(new Error('test'), 'error is about %s', 'test');

log.debug("hello world");

console.log('\n GET ERRORS FROM LOG FILES\n--------------------------------------------------------')
// Get 'mylog' log files from 'd:/log/'
// matches: regexp result of filename
// log: each line of logs
var logs = logger.get('d:/log', 'mylog', function (matches, log) {
    // skip if it's not an error log
    if (!('err' in log)) {
        return false;
    }
});

console.log(logs);