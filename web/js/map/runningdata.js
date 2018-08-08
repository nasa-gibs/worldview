import util from '../util/util';
import lodashIsEqual from 'lodash/isEqual';
import lodashIsEmpty from 'lodash/isEmpty';

export function MapRunningData(models, compareUi) {
  var self;

  self = this;
  var dataObj = {};
  /**
   * Clear running data value
   */
  self.clearAll = function() {
    if (!lodashIsEmpty(dataObj)) {
      dataObj = {};
      models.map.events.trigger('data-running', dataObj);
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
    var compareModel = models.compare;
    if (compareModel && compareModel.active) {
      if (compareModel.mode !== 'swipe') {
        return false;
      } else {
        let swipeOffset = Math.floor(compareUi.getOffset());

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
    var activeLayerObj = {};

    map.forEachLayerAtPixel(coords, function(layer, data) {
      var hex;
      var legends;
      var layerId;

      if (!layer.wv) {
        return;
      }
      if (!isFromActiveCompareRegion(map, coords, layer.wv)) return;
      if (layer.wv.def.palette) {
        layerId = layer.wv.id;
        legends = models.palettes.getLegends(layerId);
        hex = util.rgbaToHex(data[0], data[1], data[2], data[3]);
        activeLayerObj[layerId] = { legends: legends, hex: hex };
      }
    });
    if (!lodashIsEqual(activeLayerObj, dataObj)) {
      dataObj = activeLayerObj;
      models.map.events.trigger('data-running', dataObj);
    }
  };
  return self;
}
