//
// love-log
// MIT (c) GE YONG
// 2017
//

"use strict";

var process = require("process"),
    stream = require("stream"),
    fs = require("fs"),
    path = require("path"),
    util = require("util"),
    chalk = require("chalk"),
    $ = require("love-gjs"),
    br = "<br />",
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
                key: "time",
                before: function (strVal, originalVal) {
                    return chalk.gray("| " + originalVal.toLocaleString() + " | ");
                }
            },
            {
                key: "level",
                size: 6,
                after: function (strVal, originalVal) {
                    var color = colors[originalVal],
                        out = strVal.toUpperCase();
                    return (color ? color(out) : out) + " | ";
                }
            },
            {
                key: "err",
                break: true, // if is err, stop show msg
                before: function (strVal, originalVal) {
                    return originalVal.stack;
                }
            },
            {
                key: "name",
                after: function (strVal, originalVal) {
                    return chalk.cyan(strVal + ": ");
                }
            },
            {
                key: "msg"
            }
        ],
        dir: path.resolve(process.cwd(), "log"),
        maxSize: 30
    };

// formater
function formater(val, options) {
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
    return val.replace(br, "\n");
}

// Get log files
function get(dir, name, options = {}) {
    var out = {};
    if (fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach(fd => {
            var m = /^(.*)\-(\d+)(\..+)$/.exec(fd);
            if (m && (m[3] === ext && (!name || m[1] === name))) {
                fs.readFileSync(path.resolve(dir, fd), "utf8").split("\r\n").forEach(log => {
                    if (log.trim() !== "") {
                        var filter = options.filter;
                        if ("br" in options && !options.br) { // Disabled HTML BR
                            log.replace(new RegExp(br,"ig"), "\n");
                        }
                        if (!$.isFunction(filter) || filter.call(dir, m, log, log = JSON.parse(log)) !== false) {
                            if (!(m[1] in out)) {
                                out[m[1]] = [];
                            }
                            out[m[1]].push(log);
                        }
                    }
                });
            }
        });
    }
    return out;
}

// Delete log files
function del(dir, name, filter) {
    fs.readdirSync(dir).forEach(fd => {
        var m = /^(.*)\-(\d+)(\..+)$/.exec(fd);
        if (m && (m[3] === ext && (!name || m[1] === name))) {
            if (!$.isFunction(filter) || filter.call(dir, m) !== false) {
                fs.unlink(path.resolve(dir, fd), err => { });
            }
        }
    });
}

function logger(tag = "log", config = {}) {
    config = Object.assign(logger.config, config);
    var self = this,
        dir = config.dir,
        maxSize = config.maxSize,
        filePath,
        fid = 0,
        size = 0,
        hasFile;
    if (fs.existsSync(dir)) {
        // Get max log file ID
        fs.readdirSync(dir).forEach(fd => {
            var m = /^(.*)\-(\d+)(\..+)$/.exec(fd);
            if (m && m[3] === ext && m[1] === tag && isFinite(m[2])) {
                if (m[2] > fid) {
                    fid = m[2];
                }
                hasFile = 1;
            }
        });
    } else {
        fs.mkdirSync(dir);
    }
    filePath = path.resolve(dir, tag + "-" + fid + ext);
    if (hasFile) {
        size = fs.statSync(filePath).size;
    }
    // Level methods
    config.levels.forEach(level => {
        self[level] = function (a0, a1) {
            if (a0) {
                var j = {
                    time: new Date(),
                    level: level
                },
                    enFile = config.enFile,
                    enConsole = config.enConsole,
                    enSync;

                Object.assign(j, config.items); // config.items

                if ($.isPlainObject(a1)) {
                    Object.assign(j, a1.items);
                    if ("name" in a1) {
                        j.name = a1.name;
                    }
                    if ("enFile" in a1) {
                        enFile = a1.enFile;
                    }
                    if ("enConsole" in a1) {
                        enConsole = a1.enConsole;
                    }
                    if ("enSync" in a1) {
                        enSync = a1.enSync;
                    }
                }

                if ($.isError(a0)) {
                    j.err = {};
                    Object.getOwnPropertyNames(a0).forEach((k) => {
                        j.err[k] = a0[k];
                    });
                } else if ($.isArray(a0)) {
                    j.msg = util.format.apply(util, a0);
                } else {
                    j.msg = a0.toString();
                }

                if (enConsole) {
                    var str = "";
                    config.format.every(function (f) {
                        var t = f.key;
                        if (t in j) {
                            str += formater(j[t], f);
                            return !!!f.break;
                        }
                        return true;
                    });
                    console.log(str);
                    self.emit("console", j);
                }
                if (enFile) {
                    var str_j = JSON.stringify(j, function (k, v) {
                        if ($.isString(v)) {
                            return v.replace(/(?:[\r\n]+)+\s*/g, br); // replace /r /n => <br />
                        }
                        return v;
                    }) + "\r\n"; // text => html
                    size += Buffer.byteLength(str_j);
                    if (size >= maxSize * 1024 * 1024) {
                        fid++;
                        size = 0;
                        filePath = path.resolve(dir, name + "-" + fid + ext); // New log file path
                    }
                    if (enSync) {
                        fs.appendFileSync(filePath, str_j);
                    } else {
                        fs.appendFile(filePath, str_j, err => { });
                    }
                    self.emit("file", j);
                }
                self.emit("log", j);
            }
        }
    });
}

util.inherits(logger, require("events").EventEmitter); // EventEmitter

logger.get = get; // logger.get

logger.del = del; // logger.del

logger.config = defaultConfig;

module.exports = logger;
