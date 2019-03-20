import { get as lodashGet, isUndefined as lodashIsUndefined } from 'lodash';
import util from '../../util/util';

export function getCustomPalette(config, id) {
  var palette = lodashGet(config, `palettes.custom.${id}`);

  if (!palette) {
    throw new Error('Invalid palette: ' + id);
  }
  return palette;
}
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
self.get = function(layerId, index, activeGroupString, state) {
  activeGroupString = activeGroupString || state.layers.activeString;
  index = lodashIsUndefined(index) ? 0 : index;
  const palette = lodashGet(state, `palettes.${activeGroupString}.${layerId}`);
  if (palette) {
    return palette.maps[index];
  }
  return getRenderedPalette(layerId, index);
};
export function getRenderedPalette(config, layerId, index) {
  var name = lodashGet(config, `layers.${layerId}.palette.id`);
  var palette = lodashGet(config, `palettes.rendered.${name}`);
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
export function palettePromise(config, layerId, paletteId) {
  return new Promise((resolve, reject) => {
    if (config.palettes.rendered[paletteId]) {
      resolve();
    } else {
      loadRenderedPalette(config, layerId).done(function(result) {
        resolve(result);
      });
    }
  });
}
function loadRenderedPalette(config, layerId) {
  var layer = config.layers[layerId];
  return util.load.config(
    config.palettes.rendered,
    layer.palette.id,
    'config/palettes/' + layer.palette.id + '.json'
  );
}
