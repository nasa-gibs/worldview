const fs = require('fs');
const dir = require('node-dir');

const SOURCE_DIR = './config/default/common/config/wv.json/layers/';
const removeKeys = [
  'id',
  'title',
  'subtitle',
  'daynight',
  'tracks',
];

const errCallback = (err) => {
  if (err) {
    console.log(err);
    throw err;
  }
};

function processConfig(filePath) {
  const pathStrings = filePath.split('/');
  const fileName = pathStrings[pathStrings.length - 1];
  if (!fileName.includes('.json')) {
    return;
  }
  const layerJson = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const layerId = Object.keys(layerJson.layers)[0];
  removeKeys.forEach((key) => {
    const entry = layerJson.layers[layerId];
    // Leav ID prop on WMS entries
    if (entry.type === 'wms' && key === 'id') return;
    delete layerJson.layers[layerId][key];
  });
  fs.writeFile(`${filePath}`, JSON.stringify(layerJson, null, 2), errCallback);
}

dir.files(SOURCE_DIR, (err, files) => {
  if (err) throw err;
  files.forEach(processConfig);
});
