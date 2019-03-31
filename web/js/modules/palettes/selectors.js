import { get as lodashGet, isUndefined as lodashIsUndefined } from 'lodash';
import util from '../../util/util';

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
export function getPalette(layerId, index, layers, renderedPalettes, config) {
  index = lodashIsUndefined(index) ? 0 : index;
  const palette = renderedPalettes[layerId];
  if (palette) {
    return palette.maps[index];
  }
  return getRenderedPalette(config, renderedPalettes, layerId, index);
}
export function getRenderedPalette(config, renderedPalettes, layerId, index) {
  var name = lodashGet(config, `layers.${layerId}.palette.id`);
  var palette = renderedPalettes[name];
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
export function loadCustom(config) {
  return util.load.config(
    config.palettes,
    'custom',
    'config/palettes-custom.json'
  );
}
export function getLegends(layerId, layers, renderedPalettes, config) {
  var legends = [];
  var count = getCount(layerId, config, renderedPalettes);
  for (var i = 0; i < count; i++) {
    legends.push(getLegend(layerId, i, layers, renderedPalettes, config));
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
export function getLegend(layerId, index, layers, renderedPalettes, config) {
  var value = getPalette(layerId, index, layers, renderedPalettes, config);
  return value.legend || value.entries;
}
export function getCount(layerId, config, renderedPalettes) {
  const renderedPalette = getRenderedPalette(
    config,
    renderedPalettes,
    layerId,
    undefined
  );
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
export function getDefaultLegend(layerId, index, config, renderedPalettes) {
  var palette = getRenderedPalette(config, renderedPalettes, layerId, index);
  return palette.legend || palette.entries || {};
}
// export function palettePromise(config, layerId, paletteId) {
//   return new Promise((resolve, reject) => {
//     if (config.palettes.rendered[paletteId]) {
//       resolve();
//     } else {
//       loadRenderedPalette(config, layerId).done(function(result) {
//         resolve(result);
//       });
//     }
//   });
// }
// function loadRenderedPalette(config, layerId) {
//   var layer = config.layers[layerId];
//   return util.load.config(
//     config.palettes.rendered,
//     layer.palette.id,
//     'config/palettes/' + layer.palette.id + '.json'
//   );
// }
export function getCustomPalette(paletteId, customsPaletteConfig) {
  var palette = customsPaletteConfig[paletteId];
  if (!palette) {
    throw new Error('Invalid palette: ' + paletteId);
  }
  return palette;
}
