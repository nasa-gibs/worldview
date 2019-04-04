import {
  get as lodashGet,
  isUndefined as lodashIsUndefined,
  each as lodashEach,
  parseInt as lodashParseInt,
  cloneDeep as lodashCloneDeep
} from 'lodash';
import update from 'immutability-helper';

/**
 * Gets a single colormap (entries / legend combo)
 *
 *
 * @method get
 * @static
 * @param str {string} The ID of the layer
 * @param number {Number} The index of the colormap for this layer, default 0
 * object.
 * @return {object} object including the entries and legend
 */
export function getPalette(layerId, index, state) {
  const palette = lodashGet(state, `palettes.rendered.${layerId}`);
  index = lodashIsUndefined(index) ? 0 : index;
  if (palette) {
    return palette.maps[index];
  }
  return getRenderedPalette(layerId, index, state);
}
export function getRenderedPalette(layerId, index, state) {
  const { config, palettes } = state;
  var name = lodashGet(config, `layers.${layerId}.palette.id`);
  var palette = palettes.rendered[name];
  if (!palette) {
    throw new Error(name + ' Is not a rendered palette');
  }
  if (!lodashIsUndefined(index)) {
    if (palette.maps) {
      palette = palette.maps[index];
    }
  }
  return palette;
}

export function getLegends(layerId, state) {
  var legends = [];
  var count = getCount(layerId, state);
  for (var i = 0; i < count; i++) {
    legends.push(getLegend(layerId, i, state));
  }
  return legends;
}
/**
 * Gets the legend of a colormap
 *
 *
 * @method getLegend
 * @static
 * @param str {string} The ID of the layer
 * @param number {Number} The index of the colormap for this layer, default 0
 * object.
 * @return {object} object of the legend
 */
export function getLegend(layerId, index, state) {
  var value = getPalette(layerId, index, state);
  return value.legend || value.entries;
}
export function getCount(layerId, state) {
  const renderedPalette = getRenderedPalette(layerId, undefined, state);
  if (renderedPalette && renderedPalette.maps) {
    return renderedPalette.maps.length;
  } else {
    return 0;
  }
}
/**
 * Gets the legend of a colormap
 *
 *
 * @method getDefaultLegend
 * @static
 * @param str {string} The ID of the layer
 * @param number {Number} The index of the colormap for this layer, default 0
 * object.
 * @return {object} object of the legend
 */
export function getDefaultLegend(layerId, index, state) {
  var palette = getRenderedPalette(layerId, index, state);
  return palette.legend || palette.entries || {};
}

export function getCustomPalette(paletteId, customsPaletteConfig) {
  var palette = customsPaletteConfig[paletteId];
  if (!palette) {
    throw new Error('Invalid palette: ' + paletteId);
  }
  return palette;
}
var useLookup = function(layerId, palettesObj, state) {
  var use = false;
  var active = palettesObj[layerId].maps;

  lodashEach(active, function(palette, index) {
    if (palette.custom) {
      use = true;
      return false;
    }
    var rendered = getRenderedPalette(layerId, index, state);
    if (palette.type !== 'classification') {
      if (palette.min <= 0) {
        delete palette.min;
      }
      if (palette.max >= rendered.entries.values.length) {
        delete palette.max;
      }
      if (!lodashIsUndefined(palette.min) || !lodashIsUndefined(palette.max)) {
        use = true;
        return false;
      }
    }
  });
  return use;
};
// Looks up options/colormaps/layer.xml colormap entry
export function getLookup(layerId, groupstr, state) {
  groupstr = groupstr || state.compare.activeString;
  return state.palettes[groupstr][layerId].lookup;
}
var updateLookup = function(layerId, palettesObj, state) {
  let newPalettes = palettesObj;
  if (!useLookup(layerId, newPalettes, state)) {
    delete newPalettes[layerId];
    return newPalettes;
  }
  var lookup = {};
  var active = newPalettes[layerId].maps;
  lodashEach(active, function(palette, index) {
    var oldLegend = palette.legend;
    var entries = palette.entries;
    var legend = {
      colors: [],
      minLabel: oldLegend.minLabel,
      maxLabel: oldLegend.maxLabel,
      tooltips: oldLegend.tooltips,
      units: oldLegend.units,
      type: entries.type,
      title: entries.title,
      id: oldLegend.id
    };
    var source = entries.colors;
    var target = palette.custom
      ? getCustomPalette(palette.custom, state.palettes.custom).colors
      : source;

    var min = palette.min || 0;
    var max = palette.max || source.length;

    var sourceCount = source.length;
    var targetCount = target.length;
    lodashEach(source, function(color, index) {
      var targetColor;
      if (index < min || index > max) {
        targetColor = '00000000';
      } else {
        var sourcePercent, targetIndex;
        if (palette.squash) {
          sourcePercent = (index - min) / (max - min);
          if (index === max) {
            sourcePercent = 1.0;
          }
          targetIndex = Math.floor(sourcePercent * targetCount);
          if (targetIndex >= targetCount) {
            targetIndex = targetCount - 1;
          }
        } else {
          sourcePercent = index / sourceCount;
          targetIndex = Math.floor(sourcePercent * targetCount);
        }
        targetColor = target[targetIndex];
      }
      legend.colors.push(targetColor);
      var lookupSource =
        lodashParseInt(color.substring(0, 2), 16) +
        ',' +
        lodashParseInt(color.substring(2, 4), 16) +
        ',' +
        lodashParseInt(color.substring(4, 6), 16) +
        ',' +
        lodashParseInt(color.substring(6, 8), 16);
      var lookupTarget = {
        r: lodashParseInt(targetColor.substring(0, 2), 16),
        g: lodashParseInt(targetColor.substring(2, 4), 16),
        b: lodashParseInt(targetColor.substring(4, 6), 16),
        a: lodashParseInt(targetColor.substring(6, 8), 16)
      };
      lookup[lookupSource] = lookupTarget;
    });

    newPalettes = update(newPalettes, {
      [layerId]: {
        maps: { [index]: { legend: { $set: legend } } }
      }
    });
  });
  return update(newPalettes, { [layerId]: { lookup: { $set: lookup } } });
};
export function setCustom(layerId, paletteId, index, groupName, state) {
  const { config, palettes } = state;
  if (!config.layers[layerId]) {
    throw new Error('Invalid layer: ' + layerId);
  }
  let newPalettes = prepare(layerId, palettes[groupName], state);
  index = lodashIsUndefined(index) ? 0 : index;
  var active = newPalettes[layerId];
  var palette = active.maps[index];
  if (palette.custom === paletteId) {
    return;
  }
  palette.custom = paletteId;
  const paletteslol = updateLookup(layerId, newPalettes, state);
  return paletteslol;
}
export function getKey(layerId, groupStr, state) {
  groupStr = groupStr || state.compare.activeString;
  if (!isActive(layerId, groupStr, state)) {
    return '';
  }
  var def = getPalette(layerId, undefined, state);
  var keys = [];
  if (def.custom) {
    keys.push('palette=' + def.custom);
  }
  if (def.min) {
    keys.push('min=' + def.min);
  }
  if (def.max) {
    keys.push('max=' + def.max);
  }
  if (def.squash) {
    keys.push('squash');
  }
  return keys.join(',');
}
export function isActive(layerId, group, state) {
  group = group || state.compare.activeString;
  return state.palettes[group][layerId];
}
export function setRange(layerId, props, index, palettes, state) {
  let min = props.min;
  let max = props.max;
  let squash = props.squash;
  let newPalettes = prepare(layerId, palettes, state);
  index = lodashIsUndefined(index) ? 0 : index;
  if (min === 0) {
    min = undefined;
  }
  const legend = getPalette(layerId, index, state);
  if (
    legend.entries &&
    legend.entries.values &&
    max === legend.entries.values.length - 1
  ) {
    max = undefined;
  }

  // Merge custom palette props with correct colormap
  newPalettes = update(newPalettes, {
    [layerId]: {
      maps: {
        [index]: {
          $merge: {
            max,
            min,
            squash
          }
        }
      }
    }
  });

  return updateLookup(layerId, newPalettes, state);
}
export function clearCustom(layerId, index, palettes) {
  index = lodashIsUndefined(index) ? 0 : index;
  var active = palettes[layerId];
  if (!active) {
    return palettes;
  }
  var palette = active.maps[index];
  if (!palette.custom) {
    return palettes;
  }
  return update(palettes, { layerId: { maps: { $unset: ['custom'] } } }); // remove custom key
}
var prepare = function(layerId, palettesObj, state) {
  var newPalettes = lodashCloneDeep(palettesObj);
  if (!newPalettes[layerId]) newPalettes[layerId] = {};
  var active = newPalettes[layerId];
  active.maps = active.maps || [];
  lodashEach(getRenderedPalette(layerId, undefined, state).maps, function(
    palette,
    index
  ) {
    if (!active.maps[index]) {
      newPalettes = update(newPalettes, {
        [layerId]: { maps: { [index]: { $set: palette } } }
      });
    }
  });
  return newPalettes;
};
