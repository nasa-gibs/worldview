import lodashEach from 'lodash/each';
import olExtent from 'ol/extent';
import OlRendererCanvasTileLayer from 'ol/renderer/canvas/tilelayer';

export function mapPrecacheTile(models, config, cache, parent) {
  /**
   * Loads the layers that are needed for any one date.
   * Checks the cache to see if a layer has already been added to cache.
   *
   * @method promiseDay
   * @param  {object} date Date of data to be displayed on the map.
   * @return {object}      Promise.all
   */
  self.promiseDay = function (date) {
    var viewState;
    var frameState;
    var pixelRatio;
    var layers;
    var map;
    var promiseArray;

    layers = getActiveLayersWithData(date);
    map = parent.selected;
    frameState = parent.selected.frameState_; // OL object describing the current map frame
    pixelRatio = frameState.pixelRatio;
    viewState = frameState.viewState;
    promiseArray = layers.map(function (def) {
      var key;
      var layer;

      key = parent.layerKey(def, {
        date: date
      });
      layer = cache.getItem(key);
      if (layer) {
        cache.removeItem(key);
      }
      layer = parent.createLayer(def, {
        date: date,
        precache: true
      });
      return promiseLayerGroup(layer, viewState, pixelRatio, map);
    });
    return new Promise(function (resolve) {
      Promise.all(promiseArray)
        .then(function (yo) {
          resolve(date);
        });
    });
  };

  /**
   * Checks the date provided against the active layers.
   *
   * @method getActiveLayersWithData
   * @param  {object} date Date of data to be displayed on the map.
   * @return {array}       An array of visible layers within the date.
   */
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

  /**
   * Calculate the current extent from the map's extent (boundaries) &
   * the viewport extent (boundaries).
   *
   * @method calculateExtent
   * @param  {array} extent         The map extent (boundaries)
   * @param  {array} viewportExtent The current viewport extecnt (boundaries)
   * @return {array}                An extent array. Used to calculate
   * the extent for prev, next & current day
   */
  var calculateExtent = function (extent, viewportExtent) {
    if (extent[1] < -180) { // Previous day
      extent = getExtent(viewportExtent, extent);
      extent[1] = extent[1] + 360;
      extent[3] = extent[3] + 360;
    } else if (extent[1] > 180) { // Next day
      extent = getExtent(viewportExtent, extent);
      extent[1] = extent[1] - 360;
      extent[3] = extent[3] - 360;
    } else { // Current day (within map extent)
      extent = getExtent(extent, viewportExtent);
    }
    if (!isFinite(extent[0])) {
      return null;
    }
    return extent;
  };

  /**
   * Get the intersection of two extents.
   *
   * @method getExtent
   * @param  {array} extent1 Extent 1.
   * @param  {array} extent2 Extent 2.
   * @return {array}         A new extent with intersecting points
   */
  var getExtent = function (extent1, extent2) {
    return olExtent.getIntersection(extent1, extent2);
  };

  /**
   * Once a layer's group of layers (prev, current, next day) are fulfilled,
   * a promise with an array of their fulfilled values is returned.
   *
   * @method promiseLayerGroup
   * @param  {object} layer      ol_Layer_Group object, contains values.layers for prev, current, next days
   * @param  {object} viewState  Contains center, projection, resolution, rotation and zoom parameters
   * @param  {number} pixelRatio The window.devicePixelRatio, used to detect retina displays
   * @param  {object} map        _ol_Map_ object
   * @return {object}            Promise.all
   */
  var promiseLayerGroup = function (layer, viewState, pixelRatio, map) {
    var extent;
    return new Promise(function (resolve, reject) {
      var layers, layerPromiseArray;
      // Current layer's 3 layer array (prev, current, next days)
      layers = layer.values_.layers;
      if (layer.values_.layers) {
        layers = layer.getLayers()
          .getArray();
      } else {
        layers = [layer];
      }
      // Calculate the extent of each layer in the layer group
      // and create a promiseTileLayer for prev, current, next day
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

  /**
   * Returns a promise of the layer tilegrid.
   *
   * @method promiseTileLayer
   * @param  {object} layer      _ol_layer_Tile_
   * @param  {array} extent      An array of map boundaries [180, -90, 250, 90]
   * @param  {object} viewState  Contains center, projection, resolution, rotation and zoom parameters
   * @param  {number} pixelRatio The window.devicePixelRatio, used to detect retina displays
   * @return {object}            promise
   */
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
