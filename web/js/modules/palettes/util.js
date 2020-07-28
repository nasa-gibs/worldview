import update from 'immutability-helper';
import {
  each as lodashEach,
  assign as lodashAssign,
  get as lodashGet,
  size as lodashSize,
  findIndex as lodashFindIndex,
  split as lodashSplit,
  isArray,
} from 'lodash';
import Promise from 'bluebird';
import { PALETTE_STRINGS_PERMALINK_ARRAY } from './constants';
import {
  setCustomSelector,
  getCount,
  setRange as setRangeSelector,
  findIndex as findPaletteExtremeIndex,
  initDisabledSelector,
} from './selectors';
import util from '../../util/util';

/**
 * Create checkerboard canvas pattern object
 * to use on background of legend colorbars
 */
export function getCheckerboard() {
  const size = 2;
  const canvas = document.createElement('canvas');

  canvas.width = size * 2;
  canvas.height = size * 2;

  const g = canvas.getContext('2d');

  g.fillStyle = 'rgb(200, 200, 200)';
  g.fillRect(0, 0, size, size);
  g.fillRect(size, size, size, size);

  g.fillStyle = 'rgb(240, 240, 240)';
  g.fillRect(0, size, size, size);
  g.fillRect(size, 0, size, size);

  return g.createPattern(canvas, 'repeat');
}

export function palettesTranslate(source, target) {
  const translation = [];
  lodashEach(source, (color, index) => {
    const sourcePercent = index / source.length;
    const targetIndex = Math.floor(sourcePercent * target.length);
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
  height,
) {
  ctx.fillStyle = checkerBoardPattern;
  ctx.fillRect(0, 0, width, height);

  if (colors) {
    const bins = colors.length;
    const binWidth = width / bins;
    const drawWidth = Math.ceil(binWidth);
    colors.forEach((color, i) => {
      ctx.fillStyle = util.hexToRGBA(color);
      ctx.fillRect(Math.floor(binWidth * i), 0, drawWidth, height);
    });
  }
}
/**
 * Redraw canvas with selected colormap
 * @param {String} ctxStr | String of wanted cavnas
 * @param {Object} checkerBoardPattern | Background for canvas threshold
 * @param {Array} colors | array of color values
 */
export function drawSidebarPaletteOnCanvas(
  ctx,
  checkerBoardPattern,
  colors,
  width,
) {
  const barHeight = 12;
  const colorbarStartY = barHeight - 5;
  ctx.fillStyle = checkerBoardPattern;
  ctx.fillRect(1, colorbarStartY, width - 1, barHeight);

  if (colors) {
    const bins = colors.length;
    const binWidth = (width - 2) / bins;
    const drawWidth = Math.ceil(binWidth);
    const thickness = 0.5;
    ctx.strokeStyle = '#000';

    colors.forEach((color, i) => {
      ctx.fillStyle = util.hexToRGBA(color);
      ctx.fillRect(Math.floor((binWidth * i) + 1), colorbarStartY, drawWidth, barHeight);
    });
    ctx.rect(2 - thickness, colorbarStartY - thickness, width - 3 + (thickness * 2), barHeight + (thickness * 2));
    ctx.stroke();
  }
}
export function drawTicksOnCanvas(ctx, legend, width) {
  const canvasHeight = 24;
  const { ticks } = legend;
  const { colors } = legend;
  const bins = colors.length;
  const binWidth = width / bins;
  const drawWidth = Math.ceil(binWidth);
  const halfWidth = drawWidth / 2;
  if (ticks && ticks.length > 0 && bins > 100) {
    ctx.beginPath();
    ticks.forEach((tick) => {
      const start = binWidth * tick;
      const midpoint = Math.floor(start + halfWidth) + 0.5; // https://stackoverflow.com/a/8696641/4589331
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 0.8;
      ctx.moveTo(midpoint, canvasHeight - 4);
      ctx.lineTo(midpoint, canvasHeight - 1);
    });
    ctx.stroke();
    ctx.closePath();
  }
}
export function lookup(sourcePalette, targetPalette) {
  const lookup = {};
  lodashEach(sourcePalette.colors, (sourceColor, index) => {
    const source = `${parseInt(sourceColor.substring(0, 2), 16)
    },${
      parseInt(sourceColor.substring(2, 4), 16)
    },${
      parseInt(sourceColor.substring(4, 6), 16)
    },`
      + '255';
    const targetColor = targetPalette.colors[index];
    const target = {
      r: parseInt(targetColor.substring(0, 2), 16),
      g: parseInt(targetColor.substring(2, 4), 16),
      b: parseInt(targetColor.substring(4, 6), 16),
      a: 255,
    };
    lookup[source] = target;
  });
  return lookup;
}
export function loadRenderedPalette(config, layerId) {
  const layer = config.layers[layerId];
  return util.load.config(
    config.palettes.rendered,
    layer.palette.id,
    `config/palettes/${layer.palette.id}.json`,
  );
}
export function loadCustom(config) {
  return util.load.config(
    config.palettes,
    'custom',
    'config/palettes-custom.json',
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
  config,
) {
  const parts = parameters.palettes.split('~');
  parts.forEach((part) => {
    const items = part.split(',');
    const layerId = items[0];
    const paletteId = items[1];
    const index = lodashFindIndex(stateFromLocation.layers.active, {
      id: layerId,
    });
    if (
      index >= 0
      && lodashGet(stateFromLocation, `layers.active.${index}`)
      && !lodashGet(stateFromLocation, `layers.active.${index}.custom`)
    ) {
      stateFromLocation = update(stateFromLocation, {
        layers: {
          active: {
            [index]: { custom: { $set: paletteId } },
          },
        },
      });
    }
  });
  return stateFromLocation;
}
export function isSupported() {
  const { browser } = util;
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
  try {
    const count = getCount(layerId, state);
    const DEFAULT_OBJ = { isActive: false, value: undefined };
    let palObj = lodashAssign({}, { key: 'custom', array: [] }, DEFAULT_OBJ);
    let minObj = lodashAssign({}, { key: 'min', array: [] }, DEFAULT_OBJ);
    let maxObj = lodashAssign({}, { key: 'max', array: [] }, DEFAULT_OBJ);
    let squashObj = lodashAssign({}, { key: 'squash', array: [] }, DEFAULT_OBJ);
    let disabledObj = lodashAssign({}, { key: 'disabled', array: [] }, DEFAULT_OBJ);
    const attrArray = [];
    for (let i = 0; i < count; i += 1) {
      if (!palettes[layerId].maps[i]) {
        console.warn('NO PALETTE');
      }

      const paletteDef = palettes[layerId].maps[i];

      const entryLength = lodashSize(lodashGet(paletteDef, 'entries.values'))
        || lodashSize(lodashGet(paletteDef, 'entries.colors'));
      const maxValue = paletteDef.max
        ? lodashSplit(paletteDef.entries.values[paletteDef.max || entryLength], ',', 1)
        : undefined;
      const minValue = paletteDef.min
        ? lodashSplit(paletteDef.entries.values[paletteDef.min || 0], ',', 1)
        : undefined;
      const disabledValue = paletteDef.disabled && paletteDef.disabled.length
        ? paletteDef.disabled.join('-')
        : undefined;

      palObj = createPaletteAttributeObject(
        paletteDef,
        paletteDef.custom,
        palObj,
        count,
      );
      maxObj = createPaletteAttributeObject(
        paletteDef,
        maxValue,
        maxObj,
        count,
      );
      minObj = createPaletteAttributeObject(
        paletteDef,
        minValue,
        minObj,
        count,
      );

      squashObj = createPaletteAttributeObject(
        paletteDef,
        true,
        squashObj,
        count,
      );
      disabledObj = createPaletteAttributeObject(
        paletteDef,
        disabledValue,
        disabledObj,
        count,
      );
    }

    [palObj, minObj, maxObj, squashObj, disabledObj].forEach((obj) => {
      if (obj.isActive) {
        attrArray.push({
          id: obj.key === 'custom' ? 'palette' : obj.key,
          value: obj.value,
        });
      }
    });
    return attrArray;
  } catch (e) {
    console.warn(`Error parsing palette: ${e}`);
    return [];
  }
}
const createPaletteAttributeObject = function(def, value, attrObj, count) {
  const { key } = attrObj;
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
    value: attrArray.join(';'),
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
  let stateArray = [{ stateStr: 'l', groupStr: 'active' }];
  if (!isSupported()) {
    return state;
  }
  if (permlinkState.l1) {
    stateArray = [
      { stateStr: 'l', groupStr: 'active' },
      { stateStr: 'l1', groupStr: 'activeB' },
    ];
  }
  lodashEach(stateArray, (stateObj) => {
    lodashEach(state.layers[stateObj.groupStr], (layerDef) => {
      if (layerDef.palette) {
        const layerId = layerDef.id;
        const min = [];
        const max = [];
        let squash = [];
        let count = 0;
        if (layerDef.custom) {
          lodashEach(layerDef.custom, (value, index) => {
            try {
              const newPalettes = setCustomSelector(
                layerId,
                value,
                index,
                stateObj.groupStr,
                state,
              );
              state = update(state, {
                palettes: { [stateObj.groupStr]: { $set: newPalettes } },
              });
            } catch (error) {
              console.warn(` Invalid palette: ${value}`);
            }
          });
        }
        if (layerDef.min) {
          lodashEach(layerDef.min, (value, index) => {
            try {
              min.push(
                findPaletteExtremeIndex(
                  layerId,
                  'min',
                  value,
                  index,
                  stateObj.groupStr,
                  state,
                ),
              );
            } catch (error) {
              console.warn(`Unable to set min: ${value}`);
            }
          });
        }
        if (layerDef.max) {
          lodashEach(layerDef.max, (value, index) => {
            try {
              max.push(
                findPaletteExtremeIndex(
                  layerId,
                  'max',
                  value,
                  index,
                  stateObj.groupStr,
                  state,
                ),
              );
            } catch (error) {
              console.warn(`Unable to set max index: ${value}`);
            }
          });
        }
        if (layerDef.squash) {
          squash = layerDef.squash;
        }
        if (layerDef.disabled) {
          lodashEach(layerDef.disabled, (value, index) => {
            try {
              const newPalettes = initDisabledSelector(
                layerId,
                value,
                index,
                state.palettes[stateObj.groupStr],
                state,
              );
              state = update(state, {
                palettes: { [stateObj.groupStr]: { $set: newPalettes } },
              });
            } catch (error) {
              console.warn(` Invalid palette: ${value}`);
            }
          });
        }
        if (min.length > 0 || max.length > 0) {
          count = getCount(layerId, state);
          for (let i = 0; i < count; i += 1) {
            const vmin = min.length > 0 ? min[i] : undefined;
            const vmax = max.length > 0 ? max[i] : undefined;
            const vsquash = squash.length > 0 ? squash[i] : undefined;
            const props = { min: vmin, max: vmax, squash: vsquash };
            const newPalettes = setRangeSelector(
              layerId,
              props,
              i,
              state.palettes[stateObj.groupStr],
              state,
            );
            state = update(state, {
              palettes: { [stateObj.groupStr]: { $set: newPalettes } },
            });
          }
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
  config,
) {
  if (parameters.l1 || parameters.l) {
    stateFromLocation = loadPalettes(
      parameters,
      lodashAssign({}, stateFromLocation, {
        palettes: state.palettes,
        config,
      }),
    );
  }
  // legacy palettes permalink
  if (parameters.palettes && lodashGet(stateFromLocation, 'layers.active')) {
    stateFromLocation = parseLegacyPalettes(
      parameters,
      stateFromLocation,
      state,
      config,
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
  const rendered = renderedPalettes || {};
  customLoaded = customLoaded || false;
  let preloadedCustom = false;
  const requestArray = [];
  let custom = {};
  const loading = {};
  if (layersArray) {
    layersArray.forEach((obj) => {
      if (
        obj
        && obj.palette
        && !renderedPalettes[obj.palette.id]
        && !loading[obj.palette.id]
      ) {
        const paletteId = obj.palette.id;
        const location = `config/palettes/${paletteId}.json`;
        const promise = util.fetch(location, 'application/json');
        loading[paletteId] = true;
        requestArray.push(promise);
        promise.then((data) => {
          rendered[paletteId] = data;
        });
      }
      if (obj.custom && !customLoaded && !preloadedCustom) {
        const customPromise = util.fetch(
          'config/palettes-custom.json',
          'application/json',
        );
        preloadedCustom = true;
        requestArray.push(customPromise);
        customPromise.then((data) => {
          custom = data;
        });
      }
    });
    return new Promise((resolve, reject) => {
      Promise.all(requestArray)
        .then(() => {
          resolve({ custom, rendered });
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
  return Promise.resolve({ custom, rendered });
}
export function hasCustomPaletteInActiveProjection(
  activeLayers,
  activePalettes,
) {
  for (let i = 0, len = activeLayers.length; i < len; i += 1) {
    if (activePalettes[activeLayers[i].id]) {
      return true;
    }
  }
  return false;
}
export function hasCustomTypePalette(str) {
  let bool = false;
  PALETTE_STRINGS_PERMALINK_ARRAY.forEach((element) => {
    if (str.includes(element)) bool = true;
  });
  return bool;
}
