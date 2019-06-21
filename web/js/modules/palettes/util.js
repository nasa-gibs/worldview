import update from 'immutability-helper';
import {
  each as lodashEach,
  assign as lodashAssign,
  get as lodashGet,
  size as lodashSize,
  findIndex as lodashFindIndex,
  isArray
} from 'lodash';
import { PALETTE_STRINGS_PERMALINK_ARRAY } from './constants';
import {
  setCustom as setCustomSelector,
  getCount,
  setRange as setRangeSelector,
  findIndex as findPaletteExtremeIndex
} from './selectors';
import util from '../../util/util';
import Promise from 'bluebird';

/**
 * Create checkerboard canvas pattern object
 * to use on background of legend colorbars
 */
export function getCheckerboard() {
  var size = 2;
  var canvas = document.createElement('canvas');

  canvas.width = size * 2;
  canvas.height = size * 2;

  var g = canvas.getContext('2d');

  // g.fillStyle = "rgb(102, 102, 102)";
  g.fillStyle = 'rgb(200, 200, 200)';
  g.fillRect(0, 0, size, size);
  g.fillRect(size, size, size, size);

  // g.fillStyle = "rgb(153, 153, 153)";
  g.fillStyle = 'rgb(240, 240, 240)';
  g.fillRect(0, size, size, size);
  g.fillRect(size, 0, size, size);

  return g.createPattern(canvas, 'repeat');
}

export function palettesTranslate(source, target) {
  var translation = [];
  lodashEach(source, function(color, index) {
    var sourcePercent = index / source.length;
    var targetIndex = Math.floor(sourcePercent * target.length);
    translation.push(target[targetIndex]);
  });
  return translation;
}
/**
 * Redraw canvas with selected colormap
 * @param {String} ctxStr | String of wanted cavnas
 * @param {Object} checkerBoardPattern | Background for canvas threshold
 * @param {Array} colors | array of color values
 */
export function drawPaletteOnCanvas(
  ctx,
  checkerBoardPattern,
  colors,
  width,
  height
) {
  ctx.fillStyle = checkerBoardPattern;
  ctx.fillRect(0, 0, width, height);

  if (colors) {
    var bins = colors.length;
    var binWidth = width / bins;
    var drawWidth = Math.ceil(binWidth);
    colors.forEach((color, i) => {
      ctx.fillStyle = util.hexToRGBA(color);
      ctx.fillRect(Math.floor(binWidth * i), 0, drawWidth, height);
    });
  }
}
export function lookup(sourcePalette, targetPalette) {
  var lookup = {};
  lodashEach(sourcePalette.colors, function(sourceColor, index) {
    var source =
      parseInt(sourceColor.substring(0, 2), 16) +
      ',' +
      parseInt(sourceColor.substring(2, 4), 16) +
      ',' +
      parseInt(sourceColor.substring(4, 6), 16) +
      ',' +
      '255';
    var targetColor = targetPalette.colors[index];
    var target = {
      r: parseInt(targetColor.substring(0, 2), 16),
      g: parseInt(targetColor.substring(2, 4), 16),
      b: parseInt(targetColor.substring(4, 6), 16),
      a: 255
    };
    lookup[source] = target;
  });
  return lookup;
}
export function loadRenderedPalette(config, layerId) {
  var layer = config.layers[layerId];
  return util.load.config(
    config.palettes.rendered,
    layer.palette.id,
    'config/palettes/' + layer.palette.id + '.json'
  );
}
export function loadCustom(config) {
  return util.load.config(
    config.palettes,
    'custom',
    'config/palettes-custom.json'
  );
}
export function getMinValue(v) {
  return v.length ? v[0] : v;
}

export function getMaxValue(v) {
  return v.length ? v[v.length - 1] : v;
}
/**
 * Legacy palette parser
 * &palettes=something no longer promoted
 * but is still supported
 *
 * @param {Object} state
 * @param {Object} errors
 * @param {Object} config
 */
export function parseLegacyPalettes(
  parameters,
  stateFromLocation,
  state,
  config
) {
  var parts = state.palettes.split('~');
  parts.forEach(part => {
    var items = part.split(',');
    var layerId = items[0];
    var paletteId = items[1];
    var index = lodashFindIndex(stateFromLocation.layers.active, {
      id: layerId
    });
    if (
      index >= 0 &&
      lodashGet(stateFromLocation, `layers.active.${index}`) &&
      !lodashGet(stateFromLocation, `layers.active.${index}.custom`)
    ) {
      stateFromLocation = update(stateFromLocation, {
        layers: {
          active: {
            [index]: { custom: { $set: paletteId } }
          }
        }
      });
    }
  });
  return stateFromLocation;
}
export function isSupported() {
  var browser = util.browser;
  return !(browser.ie || !browser.webWorkers || !browser.cors);
}
/**
 * Serialize palette info for layer
 *
 * @param {String} layerId
 * @param {Object} palettes active|activeB palettes
 * @param {Object} state
 *
 * @returns {Array}
 */
export function getPaletteAttributeArray(layerId, palettes, state) {
  const count = getCount(layerId, state);
  const DEFAULT_OBJ = { isActive: false, value: undefined };
  let palObj = lodashAssign({}, { key: 'custom', array: [] }, DEFAULT_OBJ);
  let minObj = lodashAssign({}, { key: 'min', array: [] }, DEFAULT_OBJ);
  let maxObj = lodashAssign({}, { key: 'max', array: [] }, DEFAULT_OBJ);
  let squashObj = lodashAssign({}, { key: 'squash', array: [] }, DEFAULT_OBJ);
  let attrArray = [];
  for (var i = 0; i < count; i++) {
    let paletteDef = palettes[layerId].maps[i];
    let entryLength =
      lodashSize(lodashGet(paletteDef, 'entries.values')) ||
      lodashSize(lodashGet(paletteDef, 'entries.colors'));
    let maxValue = paletteDef.max
      ? paletteDef.entries.values[paletteDef.max || entryLength]
      : undefined;
    let minValue = paletteDef.min
      ? paletteDef.entries.values[paletteDef.min || 0]
      : undefined;
    palObj = createPaletteAttributeObject(
      paletteDef,
      paletteDef.custom,
      palObj,
      count
    );
    maxObj = createPaletteAttributeObject(paletteDef, maxValue, maxObj, count);
    minObj = createPaletteAttributeObject(paletteDef, minValue, minObj, count);

    squashObj = createPaletteAttributeObject(
      paletteDef,
      true,
      squashObj,
      count
    );
  }

  [palObj, minObj, maxObj, squashObj].forEach(obj => {
    if (obj.isActive) {
      attrArray.push({
        id: obj.key === 'custom' ? 'palette' : obj.key,
        value: obj.value
      });
    }
  });
  return attrArray;
}
const createPaletteAttributeObject = function(def, value, attrObj, count) {
  const key = attrObj.key;
  const attrArray = attrObj.array;
  let hasAtLeastOnePair = attrObj.isActive;
  value = isArray(value) ? value.join(',') : value;
  if (def[key] && value) {
    attrArray.push(value);
    hasAtLeastOnePair = true;
  } else if (count > 1) {
    attrArray.push('');
  }
  return lodashAssign({}, attrObj, {
    array: attrArray,
    isActive: hasAtLeastOnePair,
    value: attrArray.join(';')
  });
};

/**
 * Initiate palette from layer information that was derived from the
 * permalink in the layerParser
 *
 * @param {Object} permlinkState | parameters parsed from permalink
 * @param {Object} state
 */
export function loadPalettes(permlinkState, state) {
  var stateArray = [{ stateStr: 'l', groupStr: 'active' }];
  if (!isSupported()) {
    return state;
  }
  if (permlinkState.l1) {
    stateArray = [
      { stateStr: 'l', groupStr: 'active' },
      { stateStr: 'l1', groupStr: 'activeB' }
    ];
  }
  lodashEach(stateArray, stateObj => {
    lodashEach(state.layers[stateObj.groupStr], function(layerDef) {
      var layerId = layerDef.id;
      var min = [];
      var max = [];
      var squash = [];
      var count = 0;
      if (layerDef.custom) {
        lodashEach(layerDef.custom, function(value, index) {
          try {
            let newPalettes = setCustomSelector(
              layerId,
              value,
              index,
              stateObj.groupStr,
              state
            );
            state = update(state, {
              palettes: { [stateObj.groupStr]: { $set: newPalettes } }
            });
          } catch (error) {
            console.warn(' Invalid palette: ' + value);
          }
        });
      }
      if (layerDef.min) {
        lodashEach(layerDef.min, function(value, index) {
          try {
            min.push(
              findPaletteExtremeIndex(
                layerId,
                'min',
                value,
                index,
                stateObj.groupStr,
                state
              )
            );
          } catch (error) {
            console.warn('Unable to set min: ' + value);
          }
        });
      }
      if (layerDef.max) {
        lodashEach(layerDef.max, function(value, index) {
          try {
            max.push(
              findPaletteExtremeIndex(
                layerId,
                'max',
                value,
                index,
                stateObj.groupStr,
                state
              )
            );
          } catch (error) {
            console.warn('Unable to set max index: ' + value);
          }
        });
      }
      if (layerDef.squash) {
        squash = layerDef.squash;
      }

      if (min.length > 0 || max.length > 0) {
        count = getCount(layerId, state);
        for (var i = 0; i < count; i++) {
          var vmin = min.length > 0 ? min[i] : undefined;
          var vmax = max.length > 0 ? max[i] : undefined;
          var vsquash = squash.length > 0 ? squash[i] : undefined;
          let props = { min: vmin, max: vmax, squash: vsquash };
          let newPalettes = setRangeSelector(
            layerId,
            props,
            i,
            state.palettes[stateObj.groupStr],
            state
          );
          state = update(state, {
            palettes: { [stateObj.groupStr]: { $set: newPalettes } }
          });
        }
      }
    });
  });
  return state;
}
export function mapLocationToPaletteState(
  parameters,
  stateFromLocation,
  state,
  config
) {
  if (parameters.l1 || parameters.l) {
    stateFromLocation = loadPalettes(
      parameters,
      lodashAssign({}, stateFromLocation, {
        palettes: state.palettes,
        config
      })
    );
  }
  return stateFromLocation;
}
/**
 * Request palettes before page load
 * @param {Array} layersArray Array of active layers
 * @param {Object} renderedPalettes
 * @param {Boolean} customLoaded
 * @returns {Promise}
 */
export function preloadPalettes(layersArray, renderedPalettes, customLoaded) {
  let rendered = renderedPalettes || {};
  customLoaded = customLoaded || false;
  let preloadedCustom = false;
  let requestArray = [];
  let custom = {};
  let loading = {};
  if (layersArray) {
    layersArray.forEach(obj => {
      if (
        obj &&
        obj.palette &&
        !renderedPalettes[obj.palette.id] &&
        !loading[obj.palette.id]
      ) {
        const paletteId = obj.palette.id;
        const location = 'config/palettes/' + paletteId + '.json';
        const promise = util.fetch(location, 'application/json');
        loading[paletteId] = true;
        requestArray.push(promise);
        promise.then(data => {
          rendered[paletteId] = data;
        });
      }
      if (obj.custom && !customLoaded && !preloadedCustom) {
        let customPromise = util.fetch(
          'config/palettes-custom.json',
          'application/json'
        );
        preloadedCustom = true;
        requestArray.push(customPromise);
        customPromise.then(data => {
          custom = data;
        });
      }
    });
    return new Promise((resolve, reject) => {
      Promise.all(requestArray)
        .then(() => {
          resolve({ custom, rendered });
        })
        .catch(error => {
          reject(error);
        });
    });
  } else {
    return Promise.resolve({ custom, rendered });
  }
}
export function hasCustomTypePalette(str) {
  let bool = false;
  PALETTE_STRINGS_PERMALINK_ARRAY.forEach(element => {
    if (str.includes(element)) bool = true;
  });
  return bool;
}
