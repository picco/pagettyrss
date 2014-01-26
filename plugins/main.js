exports.attach = function (options) {
  var app = this;
  var async = require('async');
  var fs = require('fs');
  var handlebars = require('handlebars');
  var mongoose = require('mongoose');
  var mailer = require('nodemailer').mail;
  var winston = require('winston');

  app.conf = require('config').conf;
  app.dir = fs.realpathSync(__dirname + '/..');
  app.db = mongoose.createConnection(app.conf.db_url);

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

  /**
   * Send an email using a template.
   */
  app.mail = function(mail, template, templateData) {
    mail.from = app.conf.mail.from;
    mail.bcc = app.conf.mail.bcc;

    async.waterfall([
      function(next) {
        if (template) {
          fs.readFile(app.dir + '/mail/' + template + '.hbs', function (err, data) {
            if (err) {
              next(err);
            }
            else {
              templateData.conf = app.conf;
              mail.text = handlebars.compile(data.toString())(templateData);
              next(null);
            }
          });
        }
        else {
          next(null);
        }
      },
      function(next) {
        mailer(mail, function(err) {
          next(err);
        });
      }
    ], function(err) {
      if (err) app.err(err.toString());
    });
  }
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