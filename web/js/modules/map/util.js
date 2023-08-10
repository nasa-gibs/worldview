import * as olExtent from 'ol/extent';
import ImageLayer from 'ol/layer/Image';
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
import { getActiveVisibleLayersAtDate } from '../layers/selectors';

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
          const rotation = lodashGet(currentState, 'map.rotation');

          if (rotation) {
            const map = currentState.map.ui.selected;
            currentItemState = getRotatedExtent(map);
          }

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
 * Calculate the current extent from the map's extent (boundaries) &
 * the viewport extent (boundaries).
 *
 * @method calculateExtent
 * @param  {array} layerExtent     The layer extent
 * @param  {array} map             The current map
 * @return {array}                An extent array. Used to calculate
 * the extent for prev, next & current day
 */
function calculateExtent(layerExtent, map) {
  const viewportExtent = map.getView().calculateExtent();
  const visibleExtent = olExtent.getIntersection(viewportExtent, layerExtent);

  if (map.proj === 'geographic') {
    if (layerExtent[1] < -180) {
    // Previous day
      visibleExtent[1] += 360;
      visibleExtent[3] += 360;
    } else if (layerExtent[1] > 180) {
    // Next day
      visibleExtent[1] -= 360;
      visibleExtent[3] -= 360;
    }
  }

  // eslint-disable-next-line no-restricted-globals
  if (!isFinite(visibleExtent[0])) {
    return null;
  }
  return visibleExtent;
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
function promiseTileLayer(layer, extent, map) {
  let tileSource;
  let currentZ;
  let i;
  let tileGrid;

  return new Promise((resolve, reject) => {
    if (!extent) {
      resolve('resolve tile layer');
      return;
    }
    // OL object describing the current map frame
    const { pixelRatio, viewState } = map.frameState_;
    const { projection, resolution } = viewState;
    const { zDirection } = new OlRendererCanvasTileLayer(layer);
    tileSource = layer.getSource();
    tileGrid = tileSource.getTileGridForProjection(projection);
    currentZ = tileGrid.getZForResolution(resolution, zDirection);
    i = 0;

    const complete = function () {
      tileSource.un('tileloadend', onLoad);
      tileSource.un('tileloaderror', onLoad);
      resolve();
    };

    const onLoad = function onLoad (e) {
      if (e.type === 'tileloadend') {
        i -= 1;
        if (i === 0) {
          complete();
        }
      } else {
        // eslint-disable-next-line no-console
        console.error(`No response for tile request ${layer.wv.key}`);
        // some gibs data is not accurate and rejecting here
        // will break the animation if tile doesn't exist
        complete();
      }
    };

    const loadTile = function ([one, two, three]) {
      const tile = tileSource.getTile(one, two, three, pixelRatio, projection);
      try {
        tile.load();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(`Could not load tile with coords: [${one}, ${two}, ${three}] for extent [${extent}]`);
        // eslint-disable-next-line no-console
        console.error(e);
      }
      if (tile.state === 2) resolve();
      i += 1;
      tileSource.on('tileloadend', onLoad);
      tileSource.on('tileloaderror', onLoad);
    };

    tileGrid.forEachTileCoord(extent, currentZ, loadTile);
  });
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
 * @return {object}            Promise
 */
function promiseLayerGroup(layerGroup, map) {
  return new Promise((resolve) => {
    // Current layer's 3 layer array (prev, current, next days)
    const layers = layerGroup.getLayersArray() || [layerGroup];

    const layerPromiseArray = layers.map((layer) => {
      // TODO #3688 figure out why vector layers cause preloadinig issues
      if (layer.isVector || layer instanceof ImageLayer) return Promise.resolve();
      const layerExtent = layer.getExtent();
      const extent = calculateExtent(layerExtent, map);
      return promiseTileLayer(layer, extent, map);
    });

    Promise.all(layerPromiseArray).then(resolve);
  });
}

/**
 * Trigger tile requests for all active and visible layers on a given date.
 * This can be used to pre-cache all layers at given datetimes.
 * @method promiseImageryForTime
 * @return {object} Promise
 */
export async function promiseImageryForTime(state, date, activeString) {
  const { map } = state;
  if (!map.ui.proj) return;
  const {
    cache, selected, createLayer, layerKey,
  } = map.ui;
  const layers = getActiveVisibleLayersAtDate(state, date, activeString);
  await Promise.all(layers.map(async (layer) => {
    if (layer.type === 'granule' || layer.type === 'ttiler') {
      return Promise.resolve();
    }
    const options = { date, group: activeString };
    const key = layerKey(layer, options, state);
    const layerGroup = cache.getItem(key) || await createLayer(layer, options);
    return promiseLayerGroup(layerGroup, selected);
  }));
  selected.getView().changed();
  return date;
}
