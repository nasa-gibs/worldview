const compression = require('compression');
const express = require('express');
const path = require('path');

const port = process.env.PORT || 3000;

const app = express();
app.use(compression());
// app.use(express.static(path.join(__dirname, '../web')));
app.use('/test', express.static(path.join(__dirname, '../build/worldview'))); // test dist in a "test" sub directory
app.set('port', port);
app.listen(port, () => {
  console.log(`Worldview is available at http://localhost:${port}`);
});
