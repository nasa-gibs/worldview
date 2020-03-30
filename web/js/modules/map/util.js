import * as olExtent from 'ol/extent';
import {
  each as lodashEach,
  isUndefined as lodashIsUndefined,
  map as lodashMap,
  get as lodashGet,
  isEqual as lodashIsEqual,
} from 'lodash';
import OlRendererCanvasTileLayer from 'ol/renderer/canvas/TileLayer';
import Promise from 'bluebird';
import { encode } from '../link/util';

export function getMapParameterSetup(
  parameters,
  config,
  models,
  legacyState,
  errors,
) {
  models.map.load(legacyState, errors);
  const leadingExtent = getLeadingExtent(config.pageLoadTime);
  return {
    v: {
      stateKey: 'map.extent',
      initialState: leadingExtent,
      type: 'array',
      options: {
        delimiter: ',',
        serializeNeedsGlobalState: true,
        parse: (state) => {
          const extent = lodashMap(state.split(','), (str) => parseFloat(str));
          const valid = mapIsExtentValid(extent);
          if (!valid) {
            errors.push({
              message: `Invalid extent: ${state}`,
            });
            return leadingExtent;
          }
          return extent;
        },
        serialize: (currentItemState, currentState) => {
          const rendered = lodashGet(currentState, 'map.rendered');
          const rotation = lodashGet(currentState, 'map.rotation');

          if (rotation) {
            const map = currentState.map.ui.selected;
            currentItemState = getRotatedExtent(map);
          }

          if (!rendered) return undefined;
          const actualLeadingExtent = lodashGet(
            currentState,
            'map.leadingExtent',
          );
          const extent = mapIsExtentValid(currentItemState)
            ? currentItemState
            : leadingExtent;
          if (lodashIsEqual(actualLeadingExtent, extent)) return undefined;
          return encode(extent);
        },
      },
    },
    r: {
      stateKey: 'map.rotation',
      initialState: 0,
      options: {
        serializeNeedsGlobalState: true,
        // eslint-disable-next-line no-restricted-globals
        parse: (state) => (isNaN(state) ? state * (Math.PI / 180.0) : 0),
        serialize: (currentItemState, currentState) => (currentItemState
            && currentState.proj.selected.id !== 'geographic'
          ? (currentItemState * (180.0 / Math.PI)).toPrecision(6)
          : undefined),
      },
    },
  };
}

export function getRotatedExtent(map) {
  const view = map.getView();
  return olExtent.getForViewAndSize(view.getCenter(), view.getResolution(), 0, map.getSize());
}

/**
 * Determines if an exent object contains valid values.
 *
 * @method isExtentValid
 * @static
 *
 * @param extent {OpenLayers.Bound} The extent to check.
 *
 * @return {boolean} False if any of the values is NaN, otherwise returns
 * true.
 */
export function mapIsExtentValid(extent) {
  if (lodashIsUndefined(extent)) {
    return false;
  }
  let valid = true;
  if (extent.toArray) {
    extent = extent.toArray();
  }
  lodashEach(extent, (value) => {
    // eslint-disable-next-line no-restricted-globals
    if (isNaN(value)) {
      valid = false;
      return false;
    }
  });
  return valid;
}
/*
 * Set default extent according to time of day:
 *
 * at 00:00 UTC, start at far eastern edge of
 * map: "20.6015625,-46.546875,179.9296875,53.015625"
 *
 * at 23:00 UTC, start at far western edge of map:
 * "-179.9296875,-46.546875,-20.6015625,53.015625"
 *
 * @method getLeadingExtent
 * @static
 * @param {Object} Time
 *
 * @returns {object} Extent Array
 */
export function getLeadingExtent(loadtime) {
  let curHour = loadtime.getUTCHours();

  // For earlier hours when data is still being filled in, force a far eastern perspective
  if (curHour < 3) {
    curHour = 23;
  } else if (curHour < 9) {
    curHour = 0;
  }

  // Compute east/west bounds
  const minLon = 20.6015625 + curHour * (-200.53125 / 23.0);
  const maxLon = minLon + 159.328125;

  const minLat = -46.546875;
  const maxLat = 53.015625;

  return [minLon, minLat, maxLon, maxLat];
}

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
export function promiseLayerGroup(layer, viewState, pixelRatio, map, def) {
  let extent;
  return new Promise((resolve, reject) => {
    let layers; let
      layerPromiseArray;
    // Current layer's 3 layer array (prev, current, next days)
    layers = layer.values_.layers;
    if (layer.values_.layers) {
      layers = layer.getLayers().getArray();
    } else {
      layers = [layer];
    }
    // Calculate the extent of each layer in the layer group
    // and create a promiseTileLayer for prev, current, next day
    layerPromiseArray = layers.map((layer) => {
      extent = calculateExtent(
        layer.getExtent(),
        map.getView().calculateExtent(map.getSize()),
      );
      return promiseTileLayer(layer, extent, viewState, pixelRatio);
    });
    Promise.all(layerPromiseArray).then(() => {
      resolve('resolve layer group');
    });
  });
}
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
export function calculateExtent(extent, viewportExtent) {
  if (extent[1] < -180) {
    // Previous day
    extent = getExtent(viewportExtent, extent);
    extent[1] += 360;
    extent[3] += 360;
  } else if (extent[1] > 180) {
    // Next day
    extent = getExtent(viewportExtent, extent);
    extent[1] -= 360;
    extent[3] -= 360;
  } else {
    // Current day (within map extent)
    extent = getExtent(extent, viewportExtent);
  }
  // eslint-disable-next-line no-restricted-globals
  if (!isFinite(extent[0])) {
    return null;
  }
  return extent;
}

/**
 * Get the intersection of two extents.
 *
 * @method getExtent
 * @param  {array} extent1 Extent 1.
 * @param  {array} extent2 Extent 2.
 * @return {array}         A new extent with intersecting points
 */
function getExtent(extent1, extent2) {
  return olExtent.getIntersection(extent1, extent2);
}
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
function promiseTileLayer(layer, extent, viewState, pixelRatio) {
  let renderer;
  let tileSource;
  let currentZ;
  let i;
  let tileGrid;
  let projection;

  return new Promise((resolve, reject) => {
    if (!extent) {
      resolve('resolve tile layer');
    }
    projection = viewState.projection;
    i = 0;
    if (layer.type === 'VECTOR_TILE') {
      // No need to look up tiles, vectors can resolve ASAP
      resolve();
    } else {
      renderer = new OlRendererCanvasTileLayer(layer);
      tileSource = layer.getSource();
      // tileSource.expireCache(projection);
      tileGrid = tileSource.getTileGridForProjection(projection);
      currentZ = tileGrid.getZForResolution(
        viewState.resolution,
        renderer.zDirection,
      );
      tileGrid.forEachTileCoord(extent, currentZ, (tileCoord) => {
        let tile;
        tile = tileSource.getTile(
          tileCoord[0],
          tileCoord[1],
          tileCoord[2],
          pixelRatio,
          projection,
        );
        tile.load();

        if (tile.state === 2) resolve();

        const loader = function(e) {
          if (e.type === 'tileloadend') {
            --i;
            if (i === 0) {
              resolve();
            }
          } else {
            console.error(`No response for tile request ${layer.wv.key}`);
            resolve(); // some gibs data is not accurate and rejecting this will break the animation if tile doesn't exist
          }
          this.un('tileloadend', loader); // remove event listeners from memory
          this.un('tileloaderror', loader);
        };
        tileSource.on('tileloadend', loader);
        tileSource.on('tileloaderror', loader);
        ++i;
      });
    }
  });
}
