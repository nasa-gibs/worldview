
const _ = require('lodash');
const fs = require('fs');
const dir = require('node-dir');

const allLayerPropsMap = {};

// const errCallback = (err) => {
//   if (err) {
//     throw err;
//     console.log(err);
//   }
// };

function readFile(filePath) {
  const subStrs = filePath.split('/');
  const fileName = subStrs[subStrs.length - 1];
  if (!fileName.includes('.json')) {
    return;
  }
  const layerJson = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const fileLayerId = fileName.slice(0, fileName.length - 5);
  const objPropLayerId = fileName.slice(0, fileName.length - 5);
  if (fileLayerId !== objPropLayerId) {
    console.log('mismatch!');
  }

  const layerPropsObj = layerJson.layers[objPropLayerId];
  if (layerPropsObj) {
    Object.keys(layerPropsObj).forEach((key) => {
      allLayerPropsMap[key] = fileLayerId;
    });
  } else {
    console.log(filePath);
  }
}

dir.files('./config/default/common/config/wv.json/layers/', (err, files) => {
  if (err) throw err;
  files.forEach(readFile);
  console.log(allLayerPropsMap);

  // fs.writeFile('./config/unmodified.json', JSON.stringify(unmodifiedLayerIds, null, 2), errCallback);
});
