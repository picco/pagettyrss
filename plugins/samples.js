exports.attach = function (options) {
  var app = this;

  app.samples = {
    new: {
      "name": "- new feed -",
      "url": "",
      "item_selector": "",
      "target_selector": "",
      "title_selector": "",
      "image_selector": "",
      "content_selector": "",
      "author_selector": "",
    },
    reddit_top: {
      "name": "Reddit Top",
      "url": "http://www.reddit.com/top",
      "item_selector": ".thing",
      "target_selector": "a.title:href",
      "title_selector": "a.title",
      "image_selector": "a.thumbnail img:src",
      "content_selector": "",
      "author_selector": ".author",
    },
    _500px_popular: {
      "name": "500px Pupular",
      "url": "http://500px.com/popular",
      "item_selector": ".photo_thumb",
      "target_selector": "a:href",
      "title_selector": ".title a",
      "image_selector": "img:src",
      "content_selector": "@.description",
      "author_selector": ".info",
    }
  }

  app.defaultSampleKey = 'reddit_top';
  app.defaultSample = app.samples.reddit_top;
}
