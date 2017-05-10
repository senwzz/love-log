/*!
 * NODE-GLOGS
 * Copyright(c) 2017 Lonvenode,Inc.
*/

"use strict";

var process = require("process"),
    fs = require("fs"),
    path = require("path"),
    util = require("util"),
    chalk = require("chalk"),
    $ = require("love-gjs"),
    colors = {
        "trace": chalk.white,
        "debug": chalk.yellow,
        "info": chalk.cyan,
        "warn": chalk.yellow,
        "error": chalk.red,
        "fatal": chalk.red,
        "done": chalk.green,
        "fail": chalk.red
    },
    ext = ".log",
    defaultConfig = {
        levels: ["trace", "debug", "info", "warn", "error", "fatal", "done", "fail"],
        enFile: true,
        enConsole: true,
        format: [
            {
                name: "time",
                before: function (val, originalVal) {
                    return chalk.gray("| " + originalVal.toLocaleString() + " | ");
                }
            },
            {
                name: "level",
                size: 6,
                after: function (val, originalVal) {
                    var color = colors[originalVal],
                        out = val.toUpperCase();
                    return (color ? color(out) : out) + " | ";
                }
            },
            {
                name: "err",
                before: function (val, originalVal) {
                    return originalVal.stack.replace("<br />", "/n");
                }
            },
            {
                name: "msg"
            }
        ],
        dir: path.resolve(require("process").cwd(), "log"),
        maxSize: 30
    };

function formatVal(val, options) {
    if (options) {
        var size = options.size || 0,
            align = options.align,
            before = options.before,
            after = options.after,
            originalVal = val;
        val = val.toString();
        if ($.isFunction(before)) {
            val = before(val, originalVal) || val;
        }
        var len = val.length;
        if (len < size) {
            var x = size - len;
            if (align === "right") {
                val = new Array(x).join(" ") + val;
            } else if (align === "center") {
                var left = Math.floor(x / 2);
                var right = size - left;
                val = new Array(left).join(" ") + val + new Array(right).join(" ");
            } else {
                val = val + new Array(x).join(" ");
            }
        }
        if ($.isFunction(after)) {
            val = after(val, originalVal) || val;
        }
    }
    return val;
}

function logger(name = "log", config = {}) {
    config = Object.assign(logger.config, config);
    var self = this,
        items = config.items,
        enFile = config.enFile,
        dir = config.dir,
        maxSize = config.maxSize,
        enConsole = config.enConsole,
        levels = config.levels,
        format = config.format;

    if (enFile) {
        var filePath,
            fid = 0,
            size = 0,
            hasFile;
        // Get max log file id
        fs.readdirSync(dir).forEach(fd => {
            var m = /^(.*)\-(\d+)(\..+)$/.exec(fd);
            if (m && m[3] === ext && m[1] === name && isFinite(m[2])) {
                if (m[2] > fid) {
                    fid = m[2];
                }
                hasFile = 1;
            }
        });
        // Get log file path
        filePath = path.resolve(dir, name + "-" + fid + ext);
        if (hasFile) {
            size = fs.statSync(filePath).size;
        }
    }
    // Level methods
    levels.forEach(level => {
        self[level] = function () {
            var j = {
                name: name,
                time: new Date(),
                level: level
            },
                a0 = arguments[0];
            if (a0 instanceof Error) {
                var err = JSON.parse(JSON.stringify(a0, Object.getOwnPropertyNames(a0)));
                Object.assign(j, {
                    err: err,
                    msg: err.message
                });
            } else if ($.isPlainObject(a0)) {
                Object.assign(j, a0);
                j.msg = util.format.apply(util, Array.prototype.slice.call(arguments, 1));
            } else {
                j.msg = util.format.apply(util, Array.prototype.slice.call(arguments));
            }
            j = Object.assign({}, items, j);
            if (enConsole) {
                var str = "";
                format.forEach(function (f) {
                    var t = f.name;
                    if (t in j) {
                        str += formatVal(j[t], f);
                    }
                });
                console.log(str);
                self.emit("console", j);
            }
            if (enFile) {
                var str_j = JSON.stringify(j).replace(/\\n\s+/g, "<br />") + "\r\n"; // text => html
                size += Buffer.byteLength(str_j);
                if (size >= maxSize * 1024 * 1024) {
                    fid++;
                    size = 0;
                    filePath = path.resolve(dir, name + "-" + fid + ext); // New Log file path
                }
                fs.appendFileSync(filePath, str_j);
                self.emit("write", j);
            }
            self.emit("log", j);
        }
    });
}

// get logs
logger.get = function (dir, name, filter) {
    var out = {};
    if (fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach(fd => {
            var m = /^(.*)\-(\d+)(\..+)$/.exec(fd);
            if (m && (m[3] === ext && (!name || m[1] === name))) {
                try {
                    fs.readFileSync(path.resolve(dir, fd), "utf8").split("\r\n").forEach(log => {
                        if (log.trim() !== "") {
                            log = JSON.parse(log);
                            if (!$.isFunction(filter) || filter.call(dir, m, log, out) !== false) {
                                if (!(m[1] in out)) {
                                    out[m[1]] = [];
                                }
                                out[m[1]].push(log);
                            }
                        }
                    });
                } catch (ex) {
                    // console.log(ex);
                }
            }
        });
    }
    return out;
};

// delete log files
logger.del = function (dir, name, filter) {
    fs.readdirSync(dir).forEach(fd => {
        var m = /^(.*)\-(\d+)(\..+)$/.exec(fd);
        if (m && (m[3] === ext && (!name || m[1] === name))) {
            if (!$.isFunction(filter) || filter.call(dir, m) !== false) {
                fs.unlink(path.resolve(dir, fd), err => { });
            }
        }
    });
};

logger.config = defaultConfig;

util.inherits(logger, require("events").EventEmitter); // EventEmitter
module.exports = logger;
