import util from '../util/util';
import {
  get as lodashGet,
  isEmpty as lodashIsEmpty,
  isEqual as lodashIsEqual
} from 'lodash';
import { getPalette } from '../modules/palettes/selectors';
import {
  runningData as runningDataAction,
  clearRunningData as clearRunningDataAction
} from '../modules/map/actions';

export function MapRunningData(models, compareUi, store) {
  var self;

  self = this;
  var dataObj = {};
  /**
   * Clear running data value
   */
  self.clearAll = function() {
    if (!lodashIsEmpty(dataObj)) {
      dataObj = {};
      store.dispatch(clearRunningDataAction());
    }
  };
  /**
   * When in A|B only show Running-data from active side of Map while in swipe mode -
   * No other modes will allow for running-data
   * @param {Object} map | OL map object
   * @param {Array} coords | Coordinates of hover point
   * @param {Object} layerAttributes | Layer Properties
   */
  var isFromActiveCompareRegion = function(map, coords, layerAttributes) {
    var compareModel = store.getState().compare;
    if (compareModel && compareModel.active) {
      if (compareModel.mode !== 'swipe') {
        return false;
      } else {
        const swipeOffset = Math.floor(compareUi.getOffset());

        if (compareModel.isCompareA) {
          if (coords[0] > swipeOffset || layerAttributes.group !== 'active') {
            return false;
          }
        } else {
          if (coords[0] < swipeOffset || layerAttributes.group !== 'activeB') {
            return false;
          }
        }
      }
    }
    return true;
  };
  /*
   * Compare old and new arrays to determine which Layers need to be
   * removed
   *
   * @method LayersToRemove
   *
   * @param {Array} coords - Array of coordinate values
   *
   * @param {Object} map - OpenLayers Map Object
   *
   * @return {Void}
   *
   */
  self.newPoint = function(coords, map) {
    const state = store.getState();
    var activeLayerObj = {};
    const [lon, lat] = coord;
    if (!(lon < -180 || lon > 180 || lat < -90 || lat > 90)) {
      map.forEachFeatureAtPixel(coords, (feature, layer) => {
        if (!layer.wv || !layer.wv.def) return;
        let color;
        const def = layer.wv.def;
        const identifier = def.palette.styleProperty;
        const layerId = def.id;
        const paletteLegends = getPalette(layerId, undefined, undefined, state);
        const legend = paletteLegends.legend;

        if (!identifier && legend.colors.length > 1) return;
        if (identifier) {
          const properties = feature.getProperties();
          const value = properties[identifier] || def.palette.unclassified;
          if (!value) return;
          const tooltips = legend.tooltips.map(function(c) { return c.toLowerCase().replace(/\s/g, ''); });
          const colorIndex = tooltips.indexOf(value.toLowerCase().replace(/\s/g, ''));
          color = legend.colors[colorIndex];
        } else if (legend.colors.length === 1) {
          color = legend.colors[0];
        }
        activeLayerObj[layerId] = { paletteLegends: paletteLegends, paletteHex: color };
      });
    }
    map.forEachLayerAtPixel(coords, function(layer, data) {
      if (!layer.wv) return;
      var paletteHex;
      var paletteLegends;
      var layerId;
      const def = layer.wv.def;
      if (!isFromActiveCompareRegion(map, coords, layer.wv)) return;
      if (
        (def.palette) &&
        !lodashGet(layer, 'wv.def.disableHoverValue')
      ) {
        layerId = def.id;
        paletteLegends = getPalette(layerId, undefined, undefined, state);
        paletteHex = util.rgbaToHex(data[0], data[1], data[2], data[3]);
        activeLayerObj[layerId] = { paletteLegends: paletteLegends, paletteHex: paletteHex };
      }
    });
    if (!lodashIsEqual(activeLayerObj, dataObj)) {
      dataObj = activeLayerObj;
      store.dispatch(runningDataAction(dataObj));
    }
  };
  return self;
}
