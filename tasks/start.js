var express = require('express');
var path = require('path');
var port = process.env.PORT || 3000;

var app = express();

app.use(express.static(path.join(__dirname, '../web')));
app.set('port', port);
app.listen(port, function () {
  console.log('Worldview is available at http://localhost:' + port);
});
