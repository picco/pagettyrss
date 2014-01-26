exports.attach = function (options) {
  var app = this;
  var fs = require('fs');
  var mongoose = require('mongoose');
  var winston = require('winston');

  app.dir = fs.realpathSync(__dirname + '/..');
  app.db = mongoose.createConnection('mongodb://localhost/pagetty');

  this.use(require('../models/cache.js'));
  this.use(require('../models/feed.js'));

  /**
   * Initialize Winston logger.
   */
  app.logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)({colorize: true, timestamp: true}),
    ],
    levels: {info: 0, error: 1, access: 2},
    colors: {info: 'green', error: 'red', access: 'grey'},
  });
}

exports.init = function(callback) {
  var app = this;

  /**
   * Wrapper for winston.log().
   */
  app.log = function() {
    app.logger.info(Array.prototype.slice.call(arguments).join(" "));
  }

  /**
   * Wrapper for custom log level.
   */
  app.logAccess = function() {
    app.logger.log("access", Array.prototype.slice.call(arguments).join(" "));
  }

  /**
   * Wrapper for winston.error().
   */
  app.err = function() {
    app.logger.error(Array.prototype.slice.call(arguments).join(" "));
  }

  callback();
}