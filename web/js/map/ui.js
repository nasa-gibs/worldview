/* eslint-disable no-multi-assign */
import {
  throttle as lodashThrottle,
  forOwn as lodashForOwn,
  each as lodashEach,
  findIndex as lodashFindIndex,
  get as lodashGet,
  debounce as lodashDebounce,
  cloneDeep as lodashCloneDeep,
  find as lodashFind,
} from 'lodash';
import OlMap from 'ol/Map';
import OlView from 'ol/View';
import OlKinetic from 'ol/Kinetic';
import OlGraticule from 'ol/Graticule';
import OlStyleStroke from 'ol/style/Stroke';
import OlControlScaleLine from 'ol/control/ScaleLine';
import { altKeyOnly } from 'ol/events/condition';
import OlInteractionPinchRotate from 'ol/interaction/PinchRotate';
import OlInteractionDragRotate from 'ol/interaction/DragRotate';
import OlInteractionDoubleClickZoom from 'ol/interaction/DoubleClickZoom';
import OlInteractionPinchZoom from 'ol/interaction/PinchZoom';
import OlInteractionDragPan from 'ol/interaction/DragPan';
import OlInteractionMouseWheelZoom from 'ol/interaction/MouseWheelZoom';
import OlInteractionDragZoom from 'ol/interaction/DragZoom';
import OlLayerGroup from 'ol/layer/Group';
import * as olProj from 'ol/proj';
import { CALCULATE_RESPONSIVE_STATE } from 'redux-responsive';
import Cache from 'cachai';
import { MapRotate } from './rotation';
import { mapDateLineBuilder } from './datelinebuilder';
import { mapLayerBuilder } from './layerbuilder';
import { MapRunningData } from './runningdata';
import { mapPrecacheTile } from './precachetile';
import { mapUtilZoomAction, getActiveLayerGroup } from './util';
import { mapCompare } from './compare/compare';
import { measure } from './measure/ui';
import { LOCATION_POP_ACTION } from '../redux-location-state-customs';
import { CHANGE_PROJECTION } from '../modules/projection/constants';
import { TOGGLE as TOGGLE_INFINITE_WRAP } from '../modules/infinite-wrap/constants';
import { SELECT_DATE } from '../modules/date/constants';
import { CHANGE_UNITS } from '../modules/measure/constants';
import util from '../util/util';
import * as layerConstants from '../modules/layers/constants';
import * as compareConstants from '../modules/compare/constants';
import * as paletteConstants from '../modules/palettes/constants';
import * as vectorStyleConstants from '../modules/vector-styles/constants';
import { setStyleFunction } from '../modules/vector-styles/selectors';
import {
  getLayers,
  isRenderable as isRenderableLayer,
} from '../modules/layers/selectors';

import {
  CLEAR_ROTATE, RENDERED, UPDATE_MAP_UI, FITTED_TO_LEADING_EXTENT, REFRESH_ROTATE,
} from '../modules/map/constants';
import { getLeadingExtent } from '../modules/map/util';
import { InfiniteScroll } from './infinite-scroll';
import { updateVectorSelection } from '../modules/vector-styles/util';
import { faIconPlusSVGDomEl, faIconMinusSVGDomEl } from './fa-map-icons';

export function mapui(models, config, store, ui) {
  let layerBuilder;
  let createLayer;
  const id = 'wv-map';
  const selector = `#${id}`;
  const animationDuration = 250;
  const self = {};
  let cache;
  const rotation = new MapRotate(self, models, store);
  const dateline = mapDateLineBuilder(models, config, store, ui);
  const precache = mapPrecacheTile(models, config, cache, self);
  const compareMapUi = mapCompare(config, store);
  const measureTools = {};
  const dataRunner = self.runningdata = new MapRunningData(
    models,
    compareMapUi,
    store,
  );
  const doubleClickZoom = new OlInteractionDoubleClickZoom({
    duration: animationDuration,
  });
  cache = self.cache = new Cache(400);
  self.mapIsbeingDragged = false;
  self.mapIsbeingZoomed = false;
  self.proj = {}; // One map for each projection
  self.selected = null; // The map for the selected projection
  self.events = util.events();
  self.infiniteScroll = null;
  layerBuilder = self.layerBuilder = mapLayerBuilder(
    models,
    config,
    cache,
    ui,
    store,
  );
  self.layerKey = layerBuilder.layerKey;
  createLayer = self.createLayer = layerBuilder.createLayer;
  self.promiseDay = precache.promiseDay;
  self.selectedVectors = {};
  /**
   * Suscribe to redux store and listen for
   * specific action types
   */
  const subscribeToStore = function(action) {
    switch (action.type) {
      case layerConstants.ADD_LAYER: {
        const def = lodashFind(action.layers, { id: action.id });
        return addLayer(def);
      }
      case CLEAR_ROTATE:
        return rotation.reset(self.selected);
      case REFRESH_ROTATE:
        return rotation.setRotation(action.rotation, 500, self.selected);
      case LOCATION_POP_ACTION: {
        const newState = util.fromQueryString(action.payload.search);
        const extent = lodashGet(action, 'payload.query.map.extent');
        const rotate = lodashGet(action, 'payload.query.map.rotation') || 0;
        updateProjection();
        if (newState.v && !newState.e && extent) {
          flyToNewExtent(extent, rotate);
        }
        return;
      }
      case layerConstants.REMOVE_LAYER:
        return removeLayer(action);
      case layerConstants.TOGGLE_LAYER_VISIBILITY:
        return updateLayerVisibilities(action);
      case layerConstants.UPDATE_OPACITY:
        return updateOpacity(action);
      case compareConstants.CHANGE_STATE:
        if (store.getState().compare.mode === 'spy') {
          return reloadLayers();
        }
        return;
      case layerConstants.REORDER_LAYER_GROUP:
      case compareConstants.TOGGLE_ON_OFF:
      case compareConstants.CHANGE_MODE:
      case TOGGLE_INFINITE_WRAP:
        return reloadLayers();
      case CHANGE_PROJECTION:
        return updateProjection();
      case paletteConstants.SET_THRESHOLD_RANGE_AND_SQUASH:
      case paletteConstants.SET_CUSTOM:
      case paletteConstants.SET_DISABLED_CLASSIFICATION:
      case paletteConstants.CLEAR_CUSTOM:
        return updateLookup();
      case vectorStyleConstants.SET_FILTER_RANGE:
      case vectorStyleConstants.SET_VECTORSTYLE:
      case vectorStyleConstants.CLEAR_VECTORSTYLE:
      case CALCULATE_RESPONSIVE_STATE:
        return onResize();
      case vectorStyleConstants.SET_SELECTED_VECTORS: {
        const type = 'selection';
        const newSelection = action.payload;
        const state = store.getState();
        const { compare, layers } = state;
        const activeLayerStr = compare.activeString;
        updateVectorSelection(action.payload, self.selectedVectors, layers[activeLayerStr], type, state);
        self.selectedVectors = newSelection;
        return;
      }
      case CHANGE_UNITS:
        return toggleMeasurementUnits(action.value);
      case SELECT_DATE:
        return updateDate();
      default:
        break;
    }
  };

  /*
   * Sets up map listeners
   *
   * @method init
   * @static
   *
   * @returns {void}
   */
  const init = function() {
    // NOTE: iOS sometimes bombs if this is _.each instead. In that case,
    // it is possible that config.projections somehow becomes array-like.
    lodashForOwn(config.projections, (proj) => {
      const map = createMap(proj);
      self.proj[proj.id] = map;
    });
    self.events.on('update-layers', reloadLayers);
    self.events.on('measure-clear', clearMeasurements);
    self.events.on('measure-distance', measureDistance);
    self.events.on('measure-area', measureArea);
    self.events.on('disable-click-zoom', () => {
      doubleClickZoom.setActive(false);
    });
    self.events.on('enable-click-zoom', () => {
      setTimeout(() => {
        doubleClickZoom.setActive(true);
      }, 100);
    });
    ui.events.on('last-action', subscribeToStore);
    updateProjection(true);
  };

  const flyToNewExtent = function(extent, rotation) {
    const coordinateX = extent[0] + (extent[2] - extent[0]) / 2;
    const coordinateY = extent[1] + (extent[3] - extent[1]) / 2;
    const coordinates = [coordinateX, coordinateY];
    const resolution = self.selected.getView().getResolutionForExtent(extent);
    const zoom = self.selected.getView().getZoomForResolution(resolution);
    // Animate to extent, zoom & rotate:
    // Don't animate when an event is selected (Event selection already animates)
    return self.animate.fly(coordinates, zoom, rotation);
  };

  /*
   * Changes visual projection
   *
   * @method updateProjection
   * @static
   *
   * @param {boolean} start - new extents are needed: true/false
   *
   * @returns {void}
   */
  function updateProjection(start) {
    const state = store.getState();
    const { proj } = state;
    if (self.selected) {
      // Keep track of center point on projection switch
      self.selected.previousCenter = self.selected.center;
      hideMap(self.selected);
    }
    self.selected = self.proj[proj.id];
    const map = self.selected;
    const currentRotation = proj.id !== 'geographic' && proj.id !== 'webmerc' ? map.getView().getRotation() : 0;
    store.dispatch({ type: UPDATE_MAP_UI, ui: self, rotation: currentRotation });
    reloadLayers();

    // Update the rotation buttons if polar projection to display correct value
    if (proj.id !== 'geographic' && proj.id !== 'webmerc') {
      rotation.setResetButton(currentRotation);
    }

    // If the browser was resized, the inactive map was not notified of
    // the event. Force the update no matter what and reposition the center
    // using the previous value.
    showMap(map);
    map.updateSize();

    if (self.selected.previousCenter) {
      self.selected.setCenter(self.selected.previousCenter);
    }

    // This is awkward and needs a refactoring
    if (start) {
      const projId = proj.selected.id;
      let extent = null;
      let callback = null;
      if (models.map.extent) {
        extent = models.map.extent;
      } else if (!models.map.extent && projId === 'geographic') {
        extent = getLeadingExtent(config.pageLoadTime);
        callback = () => {
          const map = self.selected;
          const view = map.getView();
          const extent = view.calculateExtent(map.getSize());
          store.dispatch({ type: FITTED_TO_LEADING_EXTENT, extent });
        };
      }
      if (extent) {
        map.getView().fit(extent, {
          constrainResolution: false,
          callback,
        });
      }
    }
    updateExtent();
    onResize();
  }
  /*
   * When page is resised set for mobile or desktop
   *
   * @method onResize
   * @static
   *
   * @returns {void}
   */
  function onResize() {
    const map = self.selected;
    if (map.small !== util.browser.small) {
      if (util.browser.small) {
        map.removeControl(map.wv.scaleImperial);
        map.removeControl(map.wv.scaleMetric);
        $(`#${map.getTarget()} .select-wrapper`).hide();
      } else {
        map.addControl(map.wv.scaleImperial);
        map.addControl(map.wv.scaleMetric);
        $(`#${map.getTarget()} .select-wrapper`).show();
      }
    }
  }
  /*
   * Hide Map
   *
   * @method hideMap
   * @static
   *
   * @param {object} map - Openlayers Map obj
   *
   * @returns {void}
   */
  function hideMap(map) {
    $(`#${map.getTarget()}`).hide();
  }
  /*
   * Show Map
   *
   * @method showMap
   * @static
   *
   * @param {object} map - Openlayers Map obj
   *
   * @returns {void}
   */
  function showMap(map) {
    $(`#${map.getTarget()}`).show();
  }
  /*
   * Remove Layers from map
   *
   * @method clearLayers
   * @static
   *
   * @param {object} map - Openlayers Map obj
   *
   * @returns {void}
   */
  const clearLayers = function(map) {
    const activeLayers = map
      .getLayers()
      .getArray()
      .slice(0);
    lodashEach(activeLayers, (mapLayer) => {
      map.removeLayer(mapLayer);
    });
    removeGraticule('active');
    removeGraticule('activeB');
    cache.clear();
  };
  /*
   * get layers from models obj
   * and add each layer to the map
   *
   * @method reloadLayers
   * @static
   *
   * @param {object} map - Openlayers Map obj
   *
   * @returns {void}
   */
  const reloadLayers = self.reloadLayers = function(map) {
    map = map || self.selected;
    const state = store.getState();
    const {
      layers, proj, infiniteScroll, date, compare,
    } = state;
    const compareState = compare;
    const layerGroupStr = compareState.activeString;
    const activeLayers = layers[layerGroupStr];
    const activeDateStr = compareState.isCompareA ? 'selected' : 'selectedB';
    const defs = getLayers(
      activeLayers,
      {
        reverse: true,
      },
      state,
    );
    if (infiniteScroll.active) {
      self.infiniteScroll = new InfiniteScroll({
        date: date[activeDateStr], activeLayers: defs, map, createLayer, cache,
      });
    } else if (!config.features.compare || !compareState.active) {
      if (!compareState.active && compareMapUi.active) {
        compareMapUi.destroy();
      }
      clearLayers(map);

      lodashEach(defs, (def) => {
        if (isGraticule(def, proj.id)) {
          addGraticule(def.opacity, layerGroupStr);
        } else {
          map.addLayer(createLayer(def));
        }
      });
    } else {
      const stateArray = [['active', 'selected'], ['activeB', 'selectedB']];
      clearLayers(map);
      if (
        compareState
        && !compareState.isCompareA
        && compareState.mode === 'spy'
      ) {
        stateArray.reverse(); // Set Layer order based on active A|B group
      }
      lodashEach(stateArray, (arr) => {
        map.addLayer(getCompareLayerGroup(arr, layers, proj.id, state));
      });
      compareMapUi.create(map, compareState.mode);
    }
    updateLayerVisibilities();
  };
  /**
   * Create a Layergroup given the date and layerGroups
   * @param {Array} arr | Array of date/layer group strings
   */
  function getCompareLayerGroup(arr, layersState, projId, state) {
    return new OlLayerGroup({
      layers: getLayers(
        layersState[arr[0]],
        { reverse: true },
        store.getState(),
      )
        .filter((def) => {
          if (isGraticule(def, projId)) {
            addGraticule(def.opacity, arr[0]);
            return false;
          }
          return true;
        })
        .map((def) => createLayer(def, {
          date: state.date[arr[1]],
          group: arr[0],
        })),
      group: arr[0],
      date: arr[1],
    });
  }
  /*
   * Function called when layers need to be updated
   * e.g: can be the result of new data or another display
   *
   * @method updateLayerVisibilities
   * @static
   *
   * @returns {void}
   */
  function updateLayerVisibilities() {
    const state = store.getState();
    let renderable;
    const layers = self.selected.getLayers();
    const layersState = state.layers;
    const activeGroupStr = state.compare.activeString;
    const activeDateStr = state.compare.isCompareA ? 'selected' : 'selectedB';
    const updateGraticules = function(defs, groupName) {
      lodashEach(defs, (def) => {
        if (isGraticule(def, state.proj.id)) {
          renderable = isRenderableLayer(
            def.id,
            layersState[activeGroupStr],
            state.date[activeDateStr],
            state,
          );
          if (renderable) {
            addGraticule(def.opacity, groupName);
          } else {
            removeGraticule(groupName);
          }
        }
      });
    };
    layers.forEach((layer) => {
      const group = layer.get('group');
      // Not in A|B
      if (layer.wv) {
        renderable = isRenderableLayer(
          layer.wv.id,
          layersState[activeGroupStr],
          state.date[activeDateStr],
          state,
        );
        layer.setVisible(renderable);
        const defs = getLayers(layersState[activeGroupStr], {}, state);
        updateGraticules(defs);
        // If in A|B layer-group will have a 'group' string
      } else if (group) {
        lodashEach(layer.getLayers().getArray(), (subLayer) => {
          if (subLayer.wv) {
            renderable = isRenderableLayer(
              subLayer.wv.id,
              layersState[group],
              state.date[layer.get('date')],
              state,
            );
            subLayer.setVisible(renderable);
          }
        });
        layer.setVisible(true);
        const defs = getLayers(layersState[group], {}, state);
        updateGraticules(defs, group);
      }
    });
  }
  /*
   * Sets new opacity to layer
   *
   * @method updateOpacity
   * @static
   *
   * @param {object} def - layer Specs
   *
   * @param {number} value - number value
   *
   * @returns {void}
   */
  function updateOpacity(action) {
    const state = store.getState();
    const { layers, compare, proj } = state;
    const activeStr = compare.isCompareA ? 'active' : 'activeB';
    const def = lodashFind(layers[activeStr], {
      id: action.id,
    });

    if (isGraticule(def, proj.id)) {
      const strokeStyle = self[`graticule-${activeStr}-style`];
      strokeStyle.setColor(`rgba(255, 255, 255,${action.opacity})`);
      self.selected.render();
    } else {
      const layer = findLayer(def, activeStr);
      layer.setOpacity(action.opacity);
      updateLayerVisibilities();
    }
  }
  /*
   *Initiates the adding of a layer or Graticule
   *
   * @method addLayer
   * @static
   *
   * @param {object} def - layer Specs
   *
   * @returns {void}
   */

  function addLayer(def, date, activeLayers) {
    const state = store.getState();
    const { compare, layers, proj } = state;
    const activeDateStr = compare.isCompareA ? 'selected' : 'selectedB';
    const activeLayerStr = compare.isCompareA ? 'active' : 'activeB';
    date = date || state.date[activeDateStr];
    activeLayers = activeLayers || layers[activeLayerStr];
    const reverseLayers = lodashCloneDeep(activeLayers).reverse();
    const mapIndex = lodashFindIndex(reverseLayers, {
      id: def.id,
    });
    const mapLayers = self.selected.getLayers().getArray();
    const firstLayer = mapLayers[0];
    if (isGraticule(def, proj.id)) {
      addGraticule(def.opacity, activeLayerStr);
    } else if (firstLayer && firstLayer.get('group')) {
      // Find which map layer-group is the active LayerGroup
      // and add layer to layerGroup in correct location
      const activelayer = firstLayer.get('group') === activeLayerStr
        ? firstLayer
        : mapLayers[1];
      const newLayer = createLayer(def, {
        date,
        group: activeLayerStr,
      });
      activelayer.getLayers().insertAt(mapIndex, newLayer);
      compareMapUi.create(self.selected, compare.mode);
    } else {
      self.selected.getLayers().insertAt(mapIndex, createLayer(def));
    }
    updateLayerVisibilities();

    self.events.trigger('added-layer');
  }
  /*
   *Initiates the adding of a layer or Graticule
   *
   * @method removeLayer
   * @static
   *
   * @param {object} def - layer Specs
   *
   * @returns {void}
   */
  function removeLayer(action) {
    const state = store.getState();
    const { compare, proj } = state;
    const activeLayerStr = compare.isCompareA ? 'active' : 'activeB';
    const { def } = action;

    if (isGraticule(def, proj.id)) {
      removeGraticule(activeLayerStr);
    } else {
      const layer = findLayer(def, activeLayerStr);
      if (compare && compare.active) {
        const layerGroup = getActiveLayerGroup(self.selected, activeLayerStr);
        if (layerGroup) layerGroup.getLayers().remove(layer);
      } else {
        self.selected.removeLayer(layer);
      }
    }
    updateLayerVisibilities();
  }

  /*
   * Update layers for the correct Date
   *
   * @method updateDate
   * @static
   *
   *
   * @returns {void}
   */
  const updateDate = self.updateDate = function() {
    const state = store.getState();
    const { compare } = state;
    const layerState = state.layers;
    const activeLayerStr = compare.activeString;
    const activeDate = compare.isCompareA ? 'selected' : 'selectedB';
    const activeLayers = getLayers(
      layerState[activeLayerStr],
      {},
      state,
    ).reverse();
    let layerGroups;
    let layerGroup;
    if (compare && compare.active) {
      layerGroups = self.selected.getLayers().getArray();
      if (layerGroups.length === 2) {
        layerGroup = layerGroups[0].get('group') === activeLayerStr
          ? layerGroups[0]
          : layerGroups[1].get('group') === activeLayerStr
            ? layerGroups[1]
            : null;
      }
    }
    lodashEach(activeLayers, (def) => {
      const layerName = def.layer || def.id;

      if (!['subdaily', 'daily', 'monthly', 'yearly'].includes(def.period)) {
        return;
      }

      if (compare && compare.active) {
        if (layerGroup && layerGroup.getLayers().getArray().length) {
          const index = findLayerIndex(def, layerGroup);
          const layerValue = self.selected.getLayers().getArray()[index];
          layerGroup.getLayers().setAt(
            index,
            createLayer(def, {
              group: activeLayerStr,
              date: state.date[activeDate],
              previousLayer: layerValue ? layerValue.wv : null,
            }),
          );
          compareMapUi.update(activeLayerStr);
        }
      } else {
        const index = findLayerIndex(def);
        const layerValue = self.selected.getLayers().getArray()[index];
        self.selected.getLayers().setAt(index, createLayer(def, { previousLayer: layerValue ? layerValue.wv : null }));
      }
      if (config.vectorStyles && def.vectorStyle && def.vectorStyle.id) {
        const { vectorStyles } = config;
        let vectorStyleId;

        vectorStyleId = def.vectorStyle.id;
        if (state.layers[activeLayerStr]) {
          const layers = state.layers[activeLayerStr];
          layers.forEach((layer) => {
            if (layer.id === layerName && layer.custom) {
              vectorStyleId = layer.custom;
            }
          });
        }
        setStyleFunction(def, vectorStyleId, vectorStyles, null, state);
      }
    });
    updateLayerVisibilities();
  };

  /*
   * Update layers for the correct Date
   *
   * @method updateLookup
   * @static
   *
   *
   * @returns {void}
   *
   * @todo Check if this function can be combined with updateLayerOrder
   */
  function updateLookup(layerId) {
    reloadLayers();
  }

  /*
   * Get a layer object from id
   *
   * @method findlayer
   * @static
   *
   * @param {object} def - Layer Specs
   *
   *
   * @returns {object} Layer object
   */
  function findLayer(def, layerGroupStr) {
    const layers = self.selected.getLayers().getArray();
    let layer = lodashFind(layers, {
      wv: {
        id: def.id,
      },
    });

    if (!layer && layers.length && layers[0].get('group')) {
      let olGroupLayer;
      lodashEach(layers, (layerGroup) => {
        if (layerGroup.get('group') === layerGroupStr) {
          olGroupLayer = layerGroup;
        }
      });
      const subGroup = olGroupLayer.getLayers().getArray();
      layer = lodashFind(subGroup, {
        wv: {
          id: def.id,
        },
      });
    }
    return layer;
  }

  /*
   * Return an Index value for a layer in the OPenLayers layer array
   *
   * @method findLayerIndex
   * @static
   *
   * @param {object} def - Layer Specs
   *
   *
   * @returns {number} Index of layer in OpenLayers layer array
   */
  function findLayerIndex(def, layerGroup) {
    layerGroup = layerGroup || self.selected;
    const layers = layerGroup.getLayers().getArray();

    const index = lodashFindIndex(layers, {
      wv: {
        id: def.id,
      },
    });
    return index;
  }

  /*
   * Checks a layer's properties to deterimine if
   * it is a graticule
   *
   *
   * @method isGraticule
   * @static
   *
   * @param def {object} Layer Specs
   *
   *
   * @returns {boolean}
   */
  function isGraticule(def, proj) {
    return (
      def.projections[proj].type === 'graticule' || def.type === 'graticule'
    );
  }

  /*
   * Adds a graticule to the OpenLayers Map
   * if a graticule does not already exist
   *
   *
   * @method addGraticule
   * @static
   *
   *
   * @returns {void}
   */
  function addGraticule(opacity, groupStr) {
    groupStr = groupStr || 'active';
    opacity = opacity || 0.5;
    const graticule = self.selected[`graticule-${groupStr}`];
    if (graticule) {
      return;
    }
    const strokeStyle = new OlStyleStroke({
      color: `rgba(255, 255, 255,${opacity})`,
      width: 2,
      lineDash: [0.5, 4],
      opacity,
    });

    self.selected[`graticule-${groupStr}`] = new OlGraticule({
      map: self.selected,
      group: groupStr,
      strokeStyle,
    });
    self[`graticule-${groupStr}-style`] = strokeStyle;
  }

  /*
   * Adds a graticule to the OpenLayers Map
   * if a graticule does not already exist
   *
   *
   * @method removeGraticule
   * @static
   *
   * @returns {void}
   */
  function removeGraticule(groupStr) {
    groupStr = groupStr || 'active';
    const graticule = self.selected[`graticule-${groupStr}`];
    if (graticule) {
      graticule.setMap(null);
    }
    self.selected[`graticule-${groupStr}`] = null;
  }

  const triggerExtent = lodashThrottle(
    () => {
      self.events.trigger('extent');
    },
    500,
    {
      trailing: true,
    },
  );

  /*
   * Updates the extents of OpenLayers map
   *
   *
   * @method updateExtent
   * @static
   *
   * @returns {void}
   */
  function updateExtent() {
    const map = self.selected;
    const view = map.getView();
    const extent = view.calculateExtent(map.getSize());
    store.dispatch({ type: 'MAP/UPDATE_MAP_EXTENT', extent });
    triggerExtent();
  }

  const measureDistance = () => {
    const proj = self.selected.getView().getProjection().getCode();
    measureTools[proj].initMeasurement('distance');
  };

  const measureArea = () => {
    const proj = self.selected.getView().getProjection().getCode();
    measureTools[proj].initMeasurement('area');
  };

  const clearMeasurements = () => {
    const proj = self.selected.getView().getProjection().getCode();
    measureTools[proj].clearMeasurements();
  };

  const toggleMeasurementUnits = (units) => {
    Object.keys(measureTools).forEach((projection) => {
      measureTools[projection].changeUnits(units);
    });
  };

  /*
   * Updates the extents of OpenLayers map
   *
   *
   * @method updateExtent
   * @static
   *
   * @param {object} proj - Projection properties
   *
   *
   * @returns {object} OpenLayers Map Object
   */
  function createMap(proj, dateSelected) {
    const state = store.getState();
    const { date, compare } = state;
    const activeDate = compare.isCompareA ? 'selected' : 'selectedB';
    dateSelected = dateSelected || date[activeDate];
    let id;
    let $map;
    let scaleMetric;
    let scaleImperial;
    let rotateInteraction;
    let map;
    let mobileRotation;
    id = `wv-map-${proj.id}`;
    $map = $('<div></div>')
      .attr('id', id)
      .attr('data-proj', proj.id)
      .addClass('wv-map')
      .hide();
    $(selector).append($map);

    // Create two specific controls
    scaleMetric = new OlControlScaleLine({
      className: 'wv-map-scale-metric',
      units: 'metric',
    });
    scaleImperial = new OlControlScaleLine({
      className: 'wv-map-scale-imperial',
      units: 'imperial',
    });

    rotateInteraction = new OlInteractionDragRotate({
      condition: altKeyOnly,
      duration: animationDuration,
    });
    mobileRotation = new OlInteractionPinchRotate({
      duration: animationDuration,
    });
    map = new OlMap({
      view: new OlView({
        maxResolution: proj.resolutions[0],
        projection: olProj.get(proj.crs),
        center: proj.startCenter,
        rotation:
          proj.id === 'geographic' || proj.id === 'webmerc'
            ? 0.0
            : models.map.rotation,
        zoom: proj.startZoom,
        maxZoom: proj.numZoomLevels,
        enableRotation: true,
        extent: proj.id === 'geographic' ? [-Infinity, -90, Infinity, 90] : proj.maxExtent,
        constrainOnlyCenter: true,
      }),
      target: id,
      renderer: ['canvas'],
      logo: false,
      controls: [scaleMetric, scaleImperial],
      interactions: [
        doubleClickZoom,
        new OlInteractionDragPan({
          kinetic: new OlKinetic(-0.005, 0.05, 100),
        }),
        new OlInteractionPinchZoom({
          duration: animationDuration,
        }),
        new OlInteractionMouseWheelZoom({
          duration: animationDuration,
        }),
        new OlInteractionDragZoom({
          duration: animationDuration,
        }),
      ],
      loadTilesWhileAnimating: true,
    });
    map.wv = {
      small: false,
      scaleMetric,
      scaleImperial,
    };
    createZoomButtons(map, proj);
    createMousePosSel(map, proj);

    // This component is inside the map viewport container. Allowing
    // mouse move events to bubble up displays map coordinates--let those
    // be blank when over a component.
    $('.wv-map-scale-metric').mousemove((e) => e.stopPropagation());
    $('.wv-map-scale-imperial').mousemove((e) => e.stopPropagation());

    // allow rotation by dragging for polar projections
    if (proj.id !== 'geographic' && proj.id !== 'webmerc') {
      rotation.init(map, proj.id);
      map.addInteraction(rotateInteraction);
      map.addInteraction(mobileRotation);
    } else if (proj.id === 'geographic') {
      dateline.init(self, map, dateSelected);
    }

    // Set event listeners for changes on the map view (when rotated, zoomed, panned)
    map.getView().on('change:center', lodashDebounce(updateExtent, 300));
    map.getView().on('change:resolution', lodashDebounce(updateExtent, 300));
    map.getView().on('change:rotation', lodashThrottle(onRotate, 300));
    map.on('pointerdrag', () => {
      self.mapIsbeingDragged = true;
      self.events.trigger('drag');
    });
    map.getView().on('propertychange', (e) => {
      switch (e.key) {
        case 'resolution':
          self.mapIsbeingZoomed = true;
          self.events.trigger('zooming');
          break;
      }
    });
    map.on('moveend', (e) => {
      self.events.trigger('moveend');
      setTimeout(() => {
        self.mapIsbeingDragged = false;
        self.mapIsbeingZoomed = false;
      }, 200);
    });
    const onRenderComplete = () => {
      store.dispatch({ type: RENDERED });
      store.dispatch({ type: UPDATE_MAP_UI, ui: self, rotation: self.selected.getView().getRotation() });
      map.un('rendercomplete', onRenderComplete);
      if (store.getState().data.active) ui.data.onActivate();
    };
    map.on('rendercomplete', onRenderComplete);
    measureTools[proj.crs] = measure(map, self.events, store);

    return map;
  }
  /*
   * Creates map zoom buttons
   *
   *
   * @method createZoomButtons
   * @static
   *
   * @param {object} map - OpenLayers Map Object
   *
   * @param {object} proj - Projection properties
   *
   *
   * @returns {void}
   */
  function createZoomButtons(map, proj) {
    const $map = $(`#${map.getTarget()}`);

    const $zoomOut = $('<div></div>')
      .addClass('wv-map-zoom-out')
      .addClass('wv-map-zoom');
    const $outIcon = $(faIconMinusSVGDomEl);
    $zoomOut.append($outIcon);
    $map.append($zoomOut);
    $zoomOut.button({
      text: false,
    });
    $zoomOut.click(() => {
      mapUtilZoomAction(map, -1);
    });
    $zoomOut.mousemove((e) => e.stopPropagation());

    const $zoomIn = $('<div></div>')
      .addClass('wv-map-zoom-in')
      .addClass('wv-map-zoom');
    const $inIcon = $(faIconPlusSVGDomEl);
    $zoomIn.append($inIcon);
    $map.append($zoomIn);
    $zoomIn.button({
      text: false,
    });
    $zoomIn.click(() => {
      mapUtilZoomAction(map, 1);
    });
    $zoomIn.mousemove((e) => e.stopPropagation());

    /*
     * Sets zoom buttons as active or inactive based
     * on the zoom level
     *
     * @funct onZoomChange
     * @static
     *
     * @returns {void}
     *
     */
    const onZoomChange = function() {
      const { numZoomLevels } = proj;
      const zoom = map.getView().getZoom();
      if (zoom === 0) {
        $zoomIn.button('enable');
        $zoomOut.button('disable');
      } else if (zoom === numZoomLevels) {
        $zoomIn.button('disable');
        $zoomOut.button('enable');
      } else {
        $zoomIn.button('enable');
        $zoomOut.button('enable');
      }
    };

    map.getView().on('change:resolution', () => {
      onZoomChange();
      self.events.trigger('movestart');
    });
    onZoomChange();
  }

  function onRotate(val) {
    rotation.updateRotation(val);
    updateExtent();
  }
  /*
   * Creates map events based on mouse position
   *
   *
   * @method createMousePosSel
   * @static
   *
   * @param {object} map - OpenLayers Map Object
   *
   * @param {object} proj - Projection properties
   *
   *
   * @returns {void}
   *
   * @todo move this component to another Location
   */
  function createMousePosSel(map, proj) {
    let hoverThrottle;

    function onMouseMove(e) {
      let coords;
      let pixels;
      const state = store.getState();
      if (self.mapIsbeingZoomed) return;
      if (compareMapUi && compareMapUi.dragging) return;
      // if mobile return
      if (util.browser.small) return;
      // if measure is active return
      if (state.measure.isActive) return;
      // if over coords return
      if (
        $(e.relatedTarget).hasClass('map-coord')
        || $(e.relatedTarget).hasClass('coord-btn')
      ) {
        return;
      }
      pixels = map.getEventPixel(e.originalEvent);
      coords = map.getCoordinateFromPixel(pixels);
      if (!coords) return;

      // setting a limit on running-data retrievel
      if (self.mapIsbeingDragged || util.browser.small) {
        return;
      }
      // Don't add data runners if we're on the events or data tabs, or if map is animating
      const isEventsTabActive = typeof state.events !== 'undefined' && state.events.active;
      const isDataTabActive = typeof state.data !== 'undefined' && state.data.active;
      const isMapAnimating = state.animation.isPlaying;
      if (isEventsTabActive || isDataTabActive || isMapAnimating) return;

      dataRunner.newPoint(pixels, map);
    }
    $(map.getViewport())
      .mouseout((e) => {
        if (
          $(e.relatedTarget).hasClass('map-coord')
          || $(e.relatedTarget).hasClass('coord-btn')
        ) {
          return;
        }
        hoverThrottle.cancel();
        dataRunner.clearAll();
      })
      .mousemove(hoverThrottle = lodashThrottle(onMouseMove, 300));
  }

  init();
  return self;
}
