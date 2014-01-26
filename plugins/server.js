exports.attach = function (options) {
  var app = this;
  var crypto = require('crypto');
  var express = require('express');
  var hbs = require('express-hbs');
  var RSS = require('rss');
  var validator = require('validator');

  app.server = express();

  app.server.engine('hbs', hbs.express3({
    partialsDir: app.dir + '/views/partials'
  }));

  app.server.set('view engine', 'hbs');
  app.server.set('views', app.dir + '/views');
  app.server.use(express.static(app.dir + '/public'));
  app.server.use(express.bodyParser());

  app.server.get('/', function(req, res){
    res.render('index', {
      samples: app.samples,
      samplesJSON: JSON.stringify(app.samples),
      defaultSample: app.defaultSample,
    });
  });

  app.server.get('/edit/:private_id', function(req, res) {
    app.feed.findOne({private_id: req.params.private_id}, function(err, feed) {
      if (feed) {
        res.render('edit', {
          feed: feed,
          samples: app.samples,
          samplesJSON: JSON.stringify(app.samples),
          defaultSample: app.defaultSample,
        });
      }
      else {
        res.send(404);
      }
    });
  });

  app.server.get('/preview', function(req, res) {
    app.parse(req.query, function(err, items) {
      res.render('preview', {items: items});
    });
  });

  app.server.post('/publish', function(req, res) {
    var errors = [];

    if (!validator.isURL(req.body.url)) errors.push('URL is not valid.');
    if (!validator.isEmail(req.body.email)) errors.push('E-mail is not valid.');
    if (!validator.isLength(req.body.title, 1)) errors.push('Title is not defined.');
    if (!validator.isLength(req.body.item_selector, 1)) errors.push('Item selector not defined.');
    if (!validator.isLength(req.body.target_selector, 1)) errors.push('Target selector not defined.');
    if (!validator.isLength(req.body.title_selector, 1)) errors.push('Title selector not defined.');

    if (!errors.length) {
      req.body.public_id = crypto.randomBytes(8).toString('hex');
      req.body.private_id = crypto.randomBytes(8).toString('hex');

      app.feed.create(req.body, function(err, doc) {
        if (err) {
          app.err(err);
          res.render('modal_content', {status: false, title: 'Publish', errors: ['Feed could not be saved.']});
        }
        else {
          res.redirect('/edit/' + doc.private_id);
        }
      });
    }
    else {
      res.render('modal_content', {status: false, title: 'Feed could not be published', errors: errors});
    }
  });

  app.server.get('/rss/:public_id', function(req, res) {
    app.feed.findOne({public_id: req.params.public_id}, function(err, feed) {
      if (feed) {
        var rss = new RSS({
          title: feed.title,
          feed_url: 'http://pagetty.com/rss/' + feed.public_id,
          site_url: feed.url,
          author: feed.email,
        });

        app.parse(feed, function(err, items) {
          for (var i in items) {
            var item = items[i];

            rss.item({
              title: item.title,
              description: item.content,
              url: item.target,
              author: item.author,
            });
          }

          res.send(rss.xml());
        });
      }
      else {
        res.send(404);
      }
    });
  });
}

exports.init = function(done) {
  require('http').createServer(this.server).listen(80);
  done();
}
