exports.attach = function(options) {
  var app = this;
  var mongoose = require('mongoose');

  var cacheSchema = mongoose.Schema({
    url: {type: String, unique: true},
    created: Date,
    content: Buffer,
  });

  cacheSchema.index({url: 1, created: 1});

  /**
   * Gets content from cache, if up to date and available.
   */
  cacheSchema.statics.getContent = function(url, callback) {
    var now = new Date().getTime();
    // X * 60 * 1000, X = minutes.
    var createdFrom = new Date(now - (60 * 60 * 1000));

    app.cache.findOne({url: url, created: {$gt: createdFrom}}, function(err, item) {
      callback(item ? item.content : null);
    });
  }

  /**
   * Updates cache content.
   */
  cacheSchema.statics.setContent = function(url, content, callback) {
    app.cache.findOneAndUpdate({url: url}, {content: content, created: new Date()}, {upsert: true}, function(err) {
      callback(err);
    });
  }

  this.cache = app.db.model('Cache', cacheSchema, 'cache');
}
