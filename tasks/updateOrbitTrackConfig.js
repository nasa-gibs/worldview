const { layer } = require('@fortawesome/fontawesome-svg-core');
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
        console.log(layers[keys[i]]);
        const layer = layers[keys[i]];

        // const { vectorStyle } = layer;
        // const vectorStyle = { id: layer.id };

        // if (projections) {
        //   console.log(vectorStyle);
        //   if (projections.antarctic) {
        //     vectorStyle.antarctic = { id: `${layer.id}_polar` };
        //   }
        //   if (projections.arctic) {
        //     vectorStyle.arctic = { id: `${layer.id}_polar` };
        //   }

        //   delete layer.projections;
        // }
        // layer.clickDisabledFeatures = [
        //   'LineString',
        // ];
        // if (layer.format) delete layer.format;
        // layer.vectorStyle = vectorStyle;
        // layer.tags += ' vector';
        // layer.type = 'vector';
        // layer.modalShouldFollowClicks = true;
        // }

        const antarctic = layer.vectorStyle.antarctic ? {
          resolutionBreakPoint: 2048,
          source: 'GIBS:wms:antarctic',
        } : null;
        const arctic = layer.vectorStyle.antarctic ? {
          resolutionBreakPoint: 2048,
          source: 'GIBS:wms:arctic',
        } : null;
        layer.breakPointLayer = {
          id: layer.id,
          type: 'wms',
          format: 'image/png',
          breakPointType: 'max',
          projections: {
            geographic: {
              source: 'GIBS:wms',
              resolutionBreakPoint: 0.017578125,
            },
            antarctic,
            arctic,
          },
        };
      }
      const jsonDone = JSON.stringify(json, null, 2);

      fs.writeFile(filename, jsonDone, 'utf8', () => {
        console.log('written');
      });
    }
    next();
  }, () => {
    console.log('end');
  });
