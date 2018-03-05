import lodashEach from 'lodash/each';
import olExtent from 'ol/extent';
import OlRendererCanvasTileLayer from 'ol/renderer/canvas/tilelayer';

export function mapPrecacheTile(models, config, cache, parent) {
  /*
   * Loaded the layers that are needed for any one date.
   * Checks the cache to see if a layer has already
   * been added to cache.
   *
   * @method promiseDay
   * @static
   *
   * @param {object} date - Date of data to be displayed
   * on the map.
   *
   * @returns {object} Promise.all
   */
  self.promiseDay = function (date) {
    var viewState;
    var frameState;
    var extent;
    var pixelRatio;
    var layers;
    var map;
    var promiseArray;

    layers = getActiveLayersWithData(date);
    map = parent.selected;
    frameState = parent.selected.frameState_;
    pixelRatio = frameState.pixelRatio;
    viewState = frameState.viewState;
    promiseArray = layers.map(function (def) {
      var key;
      var layer;

      key = parent.layerKey(def, {
        date: date
      }, true);
      layer = cache.getItem(key);
      if (layer) {
        cache.removeItem(key);
      }
      layer = parent.createLayer(def, {
        date: date
      });
      return promiseLayerGroup(layer, extent, viewState, pixelRatio, map);
    });
    return new Promise(function (resolve) {
      Promise.all(promiseArray)
        .then(function (yo) {
          resolve(date);
        });
    });
  };

  var getActiveLayersWithData = function (date) {
    var layers;
    var arra = [];
    layers = models.layers.get();
    lodashEach(layers, function (layer) {
      if (layer.visible && new Date(layer.startDate > date)) {
        arra.push(layer);
      }
    });
    return arra;
  };

  var calculateExtent = function (extent, viewportExtent) {
    if (extent[1] < -180) {
      extent = getExtent(viewportExtent, extent);
      extent[1] = extent[1] + 360;
      extent[3] = extent[3] + 360;
    } else if (extent[1] > 180) {
      extent = getExtent(viewportExtent, extent);
      extent[1] = extent[1] - 360;
      extent[3] = extent[3] - 360;
    } else {
      extent = getExtent(extent, viewportExtent);
    }
    if (!isFinite(extent[0])) {
      return null;
    }
    return extent;
  };

  var getExtent = function (extent1, extent2) {
    return olExtent.getIntersection(extent1, extent2);
  };

  var promiseLayerGroup = function (layer, extent, viewState, pixelRatio, map) {
    return new Promise(function (resolve, reject) {
      var layers, layerPromiseArray;
      layers = layer.values_.layers;
      if (layer.values_.layers) {
        layers = layer.getLayers()
          .getArray();
      } else {
        layers = [layer];
      }
      layerPromiseArray = layers.map(function (layer) {
        extent = calculateExtent(layer.getExtent(), map.getView()
          .calculateExtent(map.getSize()));
        return promiseTileLayer(layer, extent, viewState, pixelRatio);
      });
      Promise.all(layerPromiseArray)
        .then(function (yo) {
          resolve('resolve layer group');
        });
    });
  };

  var promiseTileLayer = function (layer, extent, viewState, pixelRatio) {
    var renderer, tileSource, currentZ, i, tileGrid, projection;
    return new Promise(function (resolve, reject) {
      if (!extent) {
        resolve('resolve tile layer');
      }
      projection = viewState.projection;
      i = 0;
      renderer = new OlRendererCanvasTileLayer(layer);
      tileSource = layer.getSource();
      tileGrid = tileSource.getTileGridForProjection(projection);
      currentZ = tileGrid.getZForResolution(viewState.resolution, renderer.zDirection);
      tileGrid.forEachTileCoord(extent, currentZ, function (tileCoord) {
        var tile;
        tile = tileSource.getTile(tileCoord[0], tileCoord[1], tileCoord[2], pixelRatio, projection);
        tile.load();
        var loader = function (e) {
          if (e.type === 'tileloadend') {
            --i;
            if (i === 0) {
              resolve();
            }
          } else {
            reject(new Error('No response at this URL'));
            // resolve();// some gibs data is not accurate and rejecting this will break the animation if tile doesn't exist
          }
          this.un('tileloadend', loader); // remove event listeners from memory
          this.un('tileloaderror', loader);
        };
        tileSource.on('tileloadend', loader);
        tileSource.on('tileloaderror', loader);
        ++i;
      });
    });
  };
  return self;
};
