exports.attach = function (options) {
  var app = this;
  var _ = require('underscore');
  var $ = require('cheerio');
  var async = require('async');
  var ent = require('ent');
  var request = require('request');
  var validator = require('validator');

  /**
   * Parse HTML according to given spec.
   */
  app.parse = function(spec, callback) {
    var items = [];
    var html = null;

    app.fetch(spec, function(err, buffer) {
      if (buffer) {
        async.each($(app.bufferToString(buffer)).find(spec.item_selector).toArray().slice(0, 10), function(item, next) {
          app.parseItem(spec, item, function(item) {
            items.push(item);
            next();
          });
        },
        function(err) {
          callback(null, items);
        });
      }
      else {
        callback(null, items);
      }
    });
  }

  /**
   * TODO
   */
  app.parseItem = function(spec, data, callback) {
    var self = this;
    var targetURL = null;

    async.series({
      target: function(next) {
        self.scrape({data: data, selector: spec.target_selector}, function(data) {
          targetURL = self.sanitizeURL(spec.url, data);
          next(null, targetURL);
        });
      },
      title: function(next) {
        self.scrape({data: data, selector: spec.title_selector, targetURL: targetURL, refererURL: spec.url}, function(data) {
          next(null, self.sanitizeText(data));
        });
      },
      image: function(next) {
        self.scrape({data: data, selector: spec.image_selector, targetURL: targetURL, refererURL: spec.url}, function(data) {
          next(null, self.sanitizeURL(spec.url, data));
        });
      },
      content: function(next) {
        self.scrape({data: data, selector: spec.content_selector, targetURL: targetURL, refererURL: spec.url}, function(data) {
          next(null, self.sanitizeHTML(data));
        });
      },
      author: function(next) {
        self.scrape({data: data, selector: spec.author_selector, targetURL: targetURL, refererURL: spec.url}, function(data) {
          next(null, self.sanitizeText(data));
        });
      },
    }, function(err, item) {
      callback(item);
    });
  }

  /**
   * TODO
   */
  app.fetch = function(spec, callback) {
    app.cache.getContent(spec.url, function(buffer) {
      if (buffer) {
        callback(null, buffer);
      }
      else {
        app.fetchWithoutCache(spec, function(err, buffer) {
          app.cache.setContent(spec.url, buffer, function(err) {
            callback(null, buffer);
          });
        });
      }
    });
  }

  /**
   * Downloads the data from a given URL.
   */
  app.fetchWithoutCache = function(spec, callback) {
    var status = null;

    if (spec.url == null || !spec.url.match(/^(http|https):\/\//)) {
      app.err("fetch", "Invalid URL (", spec.url, ")");
      callback("Invalid URL: " + spec.url);
      return;
    }
    else {
      async.waterfall([
        // Download fresh content.
        function(next) {
          // When encoding is null the content is returned as a Buffer.
          var r = request.defaults({timeout: 30000, encoding: null, jar: false});

          r.get(spec, function(err, response, buffer) {
            if (response) status = response.statusCode;

            if (err) {
              next(err);
            }
            else if (response.statusCode == 403 || response.statusCode == 401) {
              next("Access denied");
            }
            else if (response.statusCode == 404) {
              next("Not found");
            }
            else {
              if (response.headers["content-encoding"] == "gzip") {
                zlib.gunzip(buffer, function(err, uncompressed) {
                  if (err) {
                    callback("Unable to parse gzipped content.");
                    return;
                  }
                  else {
                    next(null, uncompressed);
                  }
                });
              }
              else {
                next(null, buffer);
              }
            }
          });
        }
      ], function(err, buffer) {
        if (err) {
          app.err("fetch", err.toString(), status, spec.url);
          callback(err.toString());
        }
        else if (buffer && buffer.length) {
          app.log("fetch", status, parseInt(buffer.length / 1024) + "kB", spec.url);
          callback(err, buffer);
        }
        else {
          app.err("fetch", "no content", status, spec.url);
          callback("No content.");
        }
      });
    }
  }

  /**
   * Convert buffer to string with encoding autodetection.
   */
  app.bufferToString = function(buffer) {
    var charsetDetector = require("node-icu-charset-detector");
    var charset = charsetDetector.detectCharset(buffer).toString();

    try {
      return buffer.toString(charset);
    } catch (e) {
      try {
        var Iconv = require("iconv").Iconv;
        var charsetConverter = new Iconv(charset, "utf8");
        return charsetConverter.convert(buffer).toString();
      }
      catch (e) {
        try {
          return buffer.toString();
        }
        catch (e) {
          app.err("bufferToString", "charset conversion failed", charset);
          // all conversions have failed, so do not return anything.
          return '';
        }
      }
    }
  }

  /**
   * Scrape data from the source string using the given selector/attribute.
   */
  app.scrape = function(args, callback) {
    var self = this;
    var selector = args.selector;
    var input = args.data;
    var output = null;
    var attribute = null;

    async.series([
      function(next) {
        if (selector.indexOf('@') != -1) {
          app.fetch({url: args.targetURL, headers: {Referer: args.refererURL}}, function(err, buffer) {
            if (buffer) {
              // Remove @ from further processing.
              selector = selector.substring(1);
              // Replace input with HTML fetched from the target page.
              input = app.bufferToString(buffer);
              next();
            }
            else {
              next(true);
            }
          });
        }
        else {
          next();
        }
      },
      function(next) {
        if (!selector || input.length > 1048576) {
          next(true);
        }
        else {
          next();
        }
      },
      function(next) {
        if (selector.indexOf('::') != -1) {
          var split = selector.split('::');

          selector = split[0];
          attribute = split[1];
        }

        if (attribute) {
          try {
            var result = $(input).find(selector);
          }
          catch (e) {
            // do nothing
          }

          if (result.length) {
            var value = result.first().attr(attribute);

            if (value) {
              output = value;
            }
          }
        }
        else {
          try {
            var item = $(input).find(selector).first();
            $(item).find("*").after(" ");
            output = $(item).html();
          }
          catch(e) {
            app.err(e);
          }
        }

        next();
      },
    ], function(err) {
      callback(output);
    });
  }

  /**
   * Sanitize text.
   */
  app.sanitizeText = function(text) {
    if (text == null) {
      return null;
    }
    else {
      // Decode HTML entities as described in:
      // http://stackoverflow.com/questions/1147359/how-to-decode-html-entities-using-jquery
      return $("<div/>").html(text.replace(/ +/, ' ')).text();
    }
  }

  /**
   * TODO
   */
  app.sanitizeURL = function(baseURL, url) {
    if (url != null) {
      if (url.indexOf('http://') == 0 || url.indexOf('https://') == 0) {
        return url;
      }
      else {
        return require('url').resolve(baseURL, url);
      }
    }
    else {
      return null;
    }
  }

  /**
   * Sanitize HTML tags and attributes based on a provided whitelist.
   */
  app.sanitizeHTML = function(html) {
    var els = $('<div>'+ html +'</div>');
    var whitelist = app.whitelist();

    $(els).find("*").each(function() {

      var name = this[0].name.toLowerCase();
      var allowed_attrs = whitelist[name];

      if (_.isArray(allowed_attrs)) {
        var attribs = _.keys(this[0].attribs);

        for (var i = 0; i < _.size(attribs); i++) {
          if (_.indexOf(allowed_attrs, attribs[i]) == -1) {
            $(this).removeAttr(attribs[i]);
          }
        }

        if (name == "a") $(this).attr("target", "_blank");
      }
      else {
        $(this).remove();
      }

    });

    var sanitized = $(els).html();
    return (sanitized == 'null') ? null : sanitized;
  }

  /**
   * Sanitize text.
   */
  app.filterText = function(string) {
    if (string) {
      string = ent.decode(validator.toString(string));
      string = validator.toString(string).trim();
      return string;
    }
    else {
      return null;
    }
  }

  /**
   * Pass content throgh only if HTML.
   */
  app.filterHTML = function(data) {
    return data.match(/<html|<head|<body/gi) ? data : '';
  }

  /**
   * Verify that an URL can be converted to an image.
   */
  app.filterImageURL = function(url) {
    var test = new String(url);

    if (test.match(/\.(jpg|jpeg|png|gif)(\?.+)*$/gi)) return url;

    var matches = test.match(/^http:\/\/imgur\.com\/([\w\d]+)\/?$/);

    if (matches) {
      return "http://i.imgur.com/" + matches[1] + ".jpg";
    }

    var matches = test.match(/^http:\/\/www.youtube\.com\/watch\?v=([\w\d\-]+)/);

    if (matches) {
      return "http://img.youtube.com/vi/" + matches[1] + "/1.jpg";
    }

    return null;
  },

  /**
   * TODO
   */
  app.whitelist = function() {
    return {
      "a": ["href"],
      "b": [],
      "blockquote": [],
      "br": [],
      "center": [],
      "code": [],
      "div": [],
      "em": [],
      "font": [],
      "h1": [],
      "h2": [],
      "h3": [],
      "h4": [],
      "h5": [],
      "h6": [],
      "hr": [],
      "i": [],
      "img": ["src", "align"],
      "li": [],
      "ol": [],
      "p": [],
      "pre": [],
      "small": [],
      "span": [],
      "strike": [],
      "strong": [],
      "sub": [],
      "sup": [],
      "table": [],
      "thead": [],
      "tbody": [],
      "tr": [],
      "td": [],
      "th": [],
      "u": [],
      "ul": [],
    }
  }
}
