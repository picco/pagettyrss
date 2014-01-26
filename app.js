var broadway = require('broadway');
var app = new broadway.App();

app.use(require('./plugins/main.js'));
app.use(require('./plugins/parser.js'));
app.use(require('./plugins/server.js'));
app.use(require('./plugins/samples.js'));

app.init(function (err) {
  if (err) console.log(err);
});
