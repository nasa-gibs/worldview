const fs = require('fs');
const nodeDir = require('node-dir');

const palette = { immutable: true };
nodeDir.readFiles('./config/default/common/config/wv.json/layers/reference/orbits', // the root path
  {
    match: /.json$/, // only match orbit tracks
    include: /OrbitTracks/,
    recursive: false, // only the root dir
  },

  (err, content, filename, next) => {
    console.log(filename);
    if (err) {
      console.warn(err);
    } else {
      const json = JSON.parse(content);

      const { layers } = json;
      const keys = Object.keys(layers);
      for (let i = 0, { length } = keys; i < length; i++) {
        const layer = layers[keys[i]];
        const { projections } = layer;
        const vectorStyle = { id: layer.id };

        if (projections) {
          if (projections.antarctic) {
            vectorStyle.antarctic = { id: `${layer.id}_polar` };
          }
          if (projections.arctic) {
            vectorStyle.arctic = { id: `${layer.id}_polar` };
          }

          delete layer.projections;
        }
        layer.vectorStyle = vectorStyle;
        layer.layergroup = [
          'vector',
          'reference',
          'reference_orbits',
        ];
        if (layer.layerGroup) delete layer.layerGroup;
        layer.clickDisabledFeatures = [
          'LineString',
        ];

        layer.modalShouldFollowClicks = true;
      }
      const jsonDone = JSON.stringify(json, null, 2);

      fs.writeFile(filename, jsonDone, 'utf8', () => {
        console.log('written');
      });
    }
    next();
  },
  () => {
    console.log('end');
  });
