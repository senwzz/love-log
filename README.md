# love-log

A logging library for node.js.

- [x] - logs to console
- [x] - logs to file
- [x] - log file auto splitting

## Install

```bash
npm love-log -g
```

## Usage

```js
var logger = require('love-log');
var log = new logger();

// String
log.info('some info message ...');

// String format
log.info('hello %s', 'world');

// Object
log.info({item: 'test'});

// Object and string
log.info({item: 'test'}, 'hello %s', 'world');

// Error Object
log.error(new Error('test'), 'error is about %s', 'test');
```

## Config
```js
var logger = require('love-log'),
    process = require("process"),
    chalk = require('chalk');

// 1. Create config
// The following is the default
var config =  {
    levels: ["trace", "debug", "info", "warn", "error", "fatal", "done", "fail"],
        enFile: true, // enable save logs to file
        enConsole: true, // enable logs console
        // format is an arraylist to serialization the console message
        // name: name of the log
        // align: display alignment
        // size: display width
        // before: function befoe sizing
        // after: function after sizing
        format: [
            {
                name: "time",
                before: function (strVal, originalVal) {
                    return chalk.gray("| " + originalVal.toLocaleString() + " | ");
                }
            },
            {
                name: "level",
                size: 6,
                after: function (strVal, originalVal) {
                    var color = colors[originalVal],
                        out = strVal.toUpperCase();
                    return (color ? color(out) : out) + " | ";
                }
            },
            // log.error(new Error('test'));
            // if message is an error object, it will add an 'err' item that include the error's stack 
            // and it's 'msg' is error's name and message
            {
                name: "err",
                before: function (strVal, originalVal) {
                    return originalVal.stack.replace("<br />", "/n");
                }
            },
            // just display msg ...
            {
                name: "msg"
            }
        ],
        // Directory of log files
        dir: path.resolve(process.cwd(), "log"),
        // max file size of log file, if greater than this value, logs will save to a new file
        maxSize: 30 // 30MB
};

// 2. Use config
logger.config = config;

// OR
var log = new logger(config);

// ...
```

## License
MIT &copy; GE YONG
