exports.attach = function(options) {
  var app = this;
  var mongoose = require('mongoose');

  var feedSchema = mongoose.Schema({
    url: String,
    title: String,
    email: String,
    public_id: {type: String, unique: true},
    private_id: {type: String, unique: true},
    item_selector: String,
    target_selector: String,
    title_selector: String,
    image_selector: String,
    content_selector: String,
    author_selector: String,
  });

  this.feed = app.db.model('Feed', feedSchema, 'feed');
}
