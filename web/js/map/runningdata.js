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
    map.forEachLayerAtPixel(coords, function(layer, data) {
      var paletteHex;
      var paletteLegends;
      var layerId;
      if (!layer.wv) {
        return;
      }
      if (!isFromActiveCompareRegion(map, coords, layer.wv)) return;
      if (
        layer.wv.def.palette &&
        !lodashGet(layer, 'wv.def.disableHoverValue')
      ) {
        layerId = layer.wv.id;
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
