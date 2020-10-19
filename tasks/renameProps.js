const fs = require('fs');
const dir = require('node-dir');

const { GIT_HOME } = process.env;
const SOURCE_DIR = `${GIT_HOME}/layers-config/layer-metadata/v1.0/`;

const renameKeys = {
  period: 'layerPeriod',
};

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
  const metadataJson = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  Object.keys(renameKeys).forEach((key) => {
    const entry = metadataJson;
    const newKey = renameKeys[key];
    entry[newKey] = entry[key];
    delete entry[key];
  });
  fs.writeFile(`${filePath}`, JSON.stringify(metadataJson, null, 2), errCallback);
}

dir.files(SOURCE_DIR, (err, files) => {
  if (err) throw err;
  files.forEach(processConfig);
});
