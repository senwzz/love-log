# love-log 
[![npm version](https://badge.fury.io/js/love-log.svg)](https://badge.fury.io/js/love-log)

A logging library for node.js.

- [x] - Stream to console
- [x] - Stream to log file
- [x] - Auto split log file


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

## Contributing
Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](https://github.com/senwzz/love-log/issues)

## License
Copyright (c) 2017 GE YONG
Released under the MIT license
