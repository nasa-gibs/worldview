import * as olExtent from 'ol/extent';
import ImageLayer from 'ol/layer/Image';
import OlMap from 'ol/Map';
import {
  each as lodashEach,
  isUndefined as lodashIsUndefined,
  map as lodashMap,
  get as lodashGet,
  isEqual as lodashIsEqual,
} from 'lodash';
import Promise from 'bluebird';
import { encode } from '../link/util';
import { getActiveVisibleLayersAtDate } from '../layers/selectors';
import { tryCatchDate } from '../date/util';

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

let preloadMap;

/**
 * Adds the passed layer to a preloadMap, which is an invisible copy of our main OlMap
 * The layer is then removed once it is fully loaded on the preloadMap
 * This is done so because new version of OpenLayers (>= v10.2.x) no longer work properly with
 * displaying layers instantly on-screen during an animation with just pre-loading the tiles, and now
 * the layers themselves must have been rendered on an OlMap before animation to achieve the same results.
 *
 * @method promiseTileLayer
 * @param  {object} layer      _ol_layer_Tile_
 * @param  {object} map        _ol_Map_
 * @return {object}            promise
 */
function promiseTileLayer(layer, map) {
  let i = 0;
  return new Promise((resolve) => {
    if (!preloadMap) {
      const mapContainerEl = document.getElementById('wv-map');
      const mapEl = document.createElement('div');
      const id = 'wv-map-preload';

      mapEl.setAttribute('id', id);
      mapEl.style.display = 'none';
      mapContainerEl.insertAdjacentElement('afterbegin', mapEl);

      preloadMap = new OlMap({
        view: map.getView(),
        target: id,
      });
    }

    preloadMap.setView(map.getView());

    const onLoad = function onLoad (e) {
      i -= 1;
      preloadMap.removeLayer(layer);
      if (i === 0) {
        preloadMap.un('loadend', onLoad);
        resolve();
      }
    };

    if (!preloadMap.getLayers().getArray().includes(layer)) {
      i += 1;
      preloadMap.addLayer(layer);
      layer.setVisible(true);
      preloadMap.on('loadend', onLoad);
    }
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
      return promiseTileLayer(layer, map);
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
    cache, selected, createLayer, layerKey, proj,
  } = map.ui;
  const layers = getActiveVisibleLayersAtDate(state, date, activeString);
  await Promise.all(layers.map(async (layer) => {
    if (layer.type === 'granule' || layer.type === 'titiler') {
      return Promise.resolve();
    }
    const options = { date, group: activeString };
    const key = layerKey(layer, options, state);
    const cachedItem = cache.getItem(key);
    const layerGroup = cachedItem || await createLayer(layer, options);
    if (!cachedItem && layerGroup.wv.proj && proj[layerGroup.wv.proj]) {
      return promiseLayerGroup(layerGroup, proj[layerGroup.wv.proj]);
    }
  }));
  selected.getView().changed();
  return date;
}

/**
 * Trigger tile requests for all given layers on a given date.
 * @method promiseImageryForTour
 */
export async function promiseImageryForTour(state, layers, dateString, activeString) {
  const { map } = state;
  if (!map.ui.proj) return;
  const {
    cache, selected, createLayer, layerKey, proj,
  } = map.ui;
  const appNow = lodashGet(state, 'date.appNow');
  const date = tryCatchDate(dateString, appNow);
  await Promise.all(layers.map(async (layer) => {
    if (layer.type === 'granule' || layer.type === 'titiler') {
      return Promise.resolve();
    }
    const options = { date, group: activeString || 'active' };
    const keys = [];
    if (layer.custom) {
      keys.push(`palette=${layer.custom}`);
    }
    if (layer.min) {
      keys.push(`min=${layer.min}`);
    }
    if (layer.max) {
      keys.push(`max=${layer.max}`);
    }
    if (layer.squash) {
      keys.push('squash');
    }
    if (layer.size) {
      keys.push(`size=${layer.size}`);
    }
    if (keys.length > 0) {
      options.style = keys.join(',');
    }

    const key = layerKey(layer, options, state);
    const cachedItem = cache.getItem(key);
    const layerGroup = cachedItem || await createLayer(layer, options);
    if (!cachedItem && layerGroup.wv.proj && proj[layerGroup.wv.proj]) {
      return promiseLayerGroup(layerGroup, proj[layerGroup.wv.proj]);
    }
  }));
  selected.getView().changed();
}
