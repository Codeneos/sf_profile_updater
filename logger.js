'use strict';

// logger
var colors = require('colors');
var dateFormat = require('dateformat');
var fs = require('fs');
var exports = module.exports = {};

/** logging functions **/
exports.info = function(value) {
    console.log(colors.gray(dateFormat("[hh:MM:ss]")) + colors.green(" INFO ") + "- " + value);
}

exports.error = function(value) {
    console.error(colors.gray(dateFormat("[hh:MM:ss]")) + colors.red(" ERROR ") + "- " + value);
}

exports.detail = function(value) {
    console.log(colors.gray(dateFormat("[hh:MM:ss]")) + colors.gray(" DETAIL ") + "- " + value);
}
