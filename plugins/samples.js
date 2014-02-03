exports.attach = function (options) {
  var app = this;

  app.samples = {
    new: {
      "name": "- blank template -",
      "url": "",
      "item_selector": "",
      "title_selector": "",
      "target_selector": "",
      "author_selector": "",
      "image_selector": "",
      "content_selector": "",
    },
    reddit_top: {
      "name": "Reddit Top",
      "url": "http://www.reddit.com/top",
      "item_selector": ".thing",
      "title_selector": "a.title",
      "target_selector": "a.title::href",
      "author_selector": ".author",
      "image_selector": "a.thumbnail img::src",
      "content_selector": "",
    },
    _500px_popular: {
      "name": "500px Pupular",
      "url": "http://500px.com/popular",
      "item_selector": ".photo_thumb",
      "title_selector": ".title a",
      "target_selector": "a::href",
      "author_selector": ".info",
      "image_selector": "img::src",
      "content_selector": "@.description",
    },
    signal_vs_noise: {
      "name": "Signal vs. Noise blog",
      "url": "http://37signals.com/svn",
      "item_selector": "article",
      "title_selector": "h1 a",
      "target_selector": "h1 a::href",
      "author_selector": "h2 a:nth-child(2)",
      "image_selector": "",
      "content_selector": ".post-content",
    },
    imdb_top_250: {
      "name": "IMDb Top 250",
      "url": "http://www.imdb.com/chart/top",
      "item_selector": ".chart tbody tr",
      "title_selector": ".titleColumn a",
      "target_selector": ".titleColumn a::href",
      "author_selector": "@div[itemprop=director] a",
      "image_selector": "",
      "content_selector": "@p[itemprop=description]",
    },
    _9gag: {
      "name": "9gag front page",
      "url": "http://9gag.com/",
      "item_selector": "article",
      "title_selector": "h2 a",
      "target_selector": "h2 a::href",
      "author_selector": "",
      "image_selector": ".badge-item-img::src",
      "content_selector": "",
    },
    google: {
      "name": "Google search results",
      "url": "https://www.google.com/search?q=arnold+schwarzenegger",
      "item_selector": "li.g",
      "title_selector": "h3 a",
      "target_selector": "h3 a::href",
      "author_selector": "",
      "image_selector": "img::src",
      "content_selector": ".st",
    }
  }

  app.defaultSampleKey = 'reddit_top';
  app.defaultSample = app.samples.reddit_top;
}
