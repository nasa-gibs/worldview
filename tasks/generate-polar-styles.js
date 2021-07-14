const fs = require('fs');
const nodeDir = require('node-dir');

const circleRadius = [
  'step',
  [
    'zoom',
  ],
  [
    'case',
    [
      '!=',
      [
        '%',
        [
          'get',
          'minute',
        ],
        10,
      ],
      0,
    ],
    0,
    1.5,
  ],
  1,
  [
    'case',
    [
      '!=',
      [
        '%',
        [
          'get',
          'minute',
        ],
        5,
      ],
      0,
    ],
    0,
    2.5,
  ],
  2,
  [
    'case',
    [
      '!=',
      [
        '%',
        [
          'get',
          'minute',
        ],
        5,
      ],
      0,
    ],
    0,
    3.5,
  ],
  3,
  3.5,
  5,
  5,
];
const textRadialOffset = 0.2;
const textSize = [
  'step',
  [
    'zoom',
  ],
  [
    'case',
    [
      '!=',
      [
        '%',
        [
          'get',
          'minute',
        ],
        10,
      ],
      0,
    ],
    0,
    7,
  ],
  1,
  [
    'case',
    [
      '!=',
      [
        '%',
        [
          'get',
          'minute',
        ],
        5,
      ],
      0,
    ],
    0,
    7,
  ],
  2,
  [
    'case',
    [
      '!=',
      [
        '%',
        [
          'get',
          'minute',
        ],
        5,
      ],
      0,
    ],
    0,
    11,
  ],
  3,
  11,
  5,
  14,
];
nodeDir.readFiles('./config/default/common/vectorstyles/', // the root path
  {
    match: /_polar/, // only match polar tracks
    recursive: false, // only the root dir
  },

  (err, content, filename, next) => {
    console.log(filename);
    if (err) {
      console.warn(err);
    } else {
      const json = JSON.parse(content);

      const { layers } = json;
      let symbolIndex;
      for (let i = 0, { length } = layers; i < length; i++) {
        const layer = layers[i];
        if (layer.type === 'symbol') {
          symbolIndex = i;
          layer.paint['text-opacity'] = 1;
          layer.layout['text-size'] = textSize;
          layer.layout['text-radial-offset'] = textRadialOffset;
        }
        if (layer.type === 'circle') {
          layer.paint['circle-opacity'] = 1;
          layer.paint['circle-radius'] = circleRadius;
        }
      }
      layers.push(layers.splice(symbolIndex, 1)[0]);
      const jsonDone = JSON.stringify(json, null, 2);
      // var shortName = filename.split('.').slice(0, -1).join('.');
      fs.writeFile(filename, jsonDone, 'utf8', () => {
        console.log(`wrote: ${filename}.json`);
      });
    }
    next();
  },
  () => {
    console.log('end');
  });
