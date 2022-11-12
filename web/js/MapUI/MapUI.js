import React, {
  useEffect, useState, useCallback, useRef,
} from 'react';
import { connect } from 'react-redux';
/* eslint-disable no-multi-assign */
/* eslint-disable no-shadow */
/* eslint-disable no-param-reassign */
/* eslint-disable no-nested-ternary */
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
import Cache from 'cachai';
// eslint-disable-next-line import/no-unresolved
import PQueue from 'p-queue';
import Layers from './Components/Layers/Layers';
import AddLayer from './Components/Layers/AddLayer';
import RemoveLayer from './Components/Layers/RemoveLayer';
import CreateMap from './Components/CreateMap/CreateMap';
import GranuleHover from './Components/GranuleHover/GranuleHover';
import Markers from './Components/Markers/Markers';
import mapLayerBuilder from '../map/layerbuilder';
import MapRunningData from '../map/runningdata';
import { fly, saveRotation } from '../map/util';
import mapCompare from '../map/compare/compare';
import { granuleFootprint } from '../map/granule/util';
import { LOCATION_POP_ACTION } from '../redux-location-state-customs';
import { CHANGE_PROJECTION } from '../modules/projection/constants';
import { SET_SCREEN_INFO } from '../modules/screen-size/constants';
import {
  REMOVE_MARKER,
  SET_MARKER,
  TOGGLE_DIALOG_VISIBLE,
} from '../modules/location-search/constants';
import { setGeocodeResults, removeMarker } from '../modules/location-search/actions';
import * as dateConstants from '../modules/date/constants';
import util from '../util/util';
import * as layerConstants from '../modules/layers/constants';
import * as compareConstants from '../modules/compare/constants';
import * as paletteConstants from '../modules/palettes/constants';
import * as vectorStyleConstants from '../modules/vector-styles/constants';
import { setStyleFunction } from '../modules/vector-styles/selectors';
import {
  getLayers,
  getActiveLayers,
  getActiveLayerGroup,
  isRenderable as isRenderableLayer,
  getMaxZoomLevelLayerCollection,
  getAllActiveLayers,
  getGranuleCount,
  getGranuleLayer,
  getActiveGranuleFootPrints,
} from '../modules/layers/selectors';
import { getSelectedDate } from '../modules/date/selectors';
import { getNumberStepsBetween, getNextDateTime } from '../modules/date/util';
import { EXIT_ANIMATION, STOP_ANIMATION } from '../modules/animation/constants';
import {
  RENDERED, UPDATE_MAP_UI, UPDATE_MAP_EXTENT, UPDATE_MAP_ROTATION, FITTED_TO_LEADING_EXTENT, REFRESH_ROTATE, CLEAR_ROTATE,
} from '../modules/map/constants';
import { getLeadingExtent, promiseImageryForTime } from '../modules/map/util';
import { updateVectorSelection } from '../modules/vector-styles/util';
import { animateCoordinates, getCoordinatesMarker, areCoordinatesWithinExtent } from '../modules/location-search/util';
import { getNormalizedCoordinate } from '../components/location-search/util';
import { reverseGeocode } from '../modules/location-search/util-api';
import { startLoading, stopLoading, MAP_LOADING } from '../modules/loading/actions';
import {
  MAP_DISABLE_CLICK_ZOOM,
  MAP_ENABLE_CLICK_ZOOM,
  REDUX_ACTION_DISPATCHED,
  GRANULE_HOVERED,
  GRANULE_HOVER_UPDATE,
  MAP_DRAG,
  MAP_MOUSE_MOVE,
  MAP_MOUSE_OUT,
  MAP_MOVE_START,
  MAP_ZOOMING,
} from '../util/constants';
import {
  fitToLeadingExtent,
  refreshRotation,
  updateMapExtent,
  updateRenderedState,
  updateMapUI,
} from '../modules/map/actions';
import { clearPreload, setPreload } from '../modules/date/actions';

const { events } = util;

const MapUI = (props) => {
  const {
    activeLayers,
    activeString,
    arrowDown,
    clearPreload,
    compare,
    compareMapUi,
    config,
    fitToLeadingExtent,
    isMobile,
    lastArrowDirection,
    layerQueue,
    layers,
    map,
    models,
    nextDate,
    preloaded,
    prevDate,
    proj,
    selectedDate,
    selectedDateB,
    setPreload,
    setUI,
    state,
    store,
    ui,
    updateMapExtent,
    updateMapUI,
  } = props;

  const [markerAction, setMarkerAction] = useState({});
  const [removeLayerAction, setRemoveLayerAction] = useState({});
  const [addLayerAction, setAddLayerAction] = useState({});
  const [granuleFootprints, setGranuleFootprints] = useState({});
  const [isMapSet, setMap] = useState(false);

  // useEffect(() => {
  //   console.log('IS MOBILE TRUE?', isMobile)
  // })

  const subscribeToStore = function(action) {
    switch (action.type) {
      case layerConstants.UPDATE_GRANULE_LAYER_OPTIONS: {
        const granuleOptions = {
          id: action.id,
          reset: null,
        };
        return reloadLayers(granuleOptions);
      }
      case layerConstants.RESET_GRANULE_LAYER_OPTIONS: {
        const granuleOptions = {
          id: action.id,
          reset: action.id,
        };
        return reloadLayers(granuleOptions);
      }
      case layerConstants.ADD_LAYER: {
        const def = lodashFind(action.layers, { id: action.id });
        if (def.type === 'granule') {
          ui.processingPromise = new Promise((resolve) => {
            resolve(setAddLayerAction(def));
          });
          return setAddLayerAction(def);
        }
        clearPreload();
        return setAddLayerAction(def);
      }
      case REMOVE_MARKER: {
        return setMarkerAction(action);
      }
      case SET_MARKER: {
        return setMarkerAction(action);
      }
      case TOGGLE_DIALOG_VISIBLE:
        return setMarkerAction(action);
      case CLEAR_ROTATE: {
        ui.selected.getView().animate({
          duration: 500,
          rotation: 0,
        });
        return;
      }
      case REFRESH_ROTATE: {
        ui.selected.getView().animate({
          rotation: action.rotation,
          duration: 500,
        });
        return;
      }
      case LOCATION_POP_ACTION: {
        const newState = util.fromQueryString(action.payload.search);
        const extent = lodashGet(state, 'map.extent');
        const rotate = lodashGet(state, 'map.rotation') || 0;
        setTimeout(() => {
          updateProjection();
          if (newState.v && !newState.e && extent) {
            flyToNewExtent(extent, rotate);
          }
        }, 200);
        return;
      }
      case layerConstants.REMOVE_GROUP:
      case layerConstants.REMOVE_LAYER:
        return setRemoveLayerAction(action.layersToRemove);
      case layerConstants.UPDATE_OPACITY:
        return updateOpacity(action);
      case compareConstants.CHANGE_STATE:
        if (store.getState().compare.mode === 'spy') {
          return reloadLayers();
        }
        return;
      case layerConstants.TOGGLE_OVERLAY_GROUPS:
        return reloadLayers();
      case layerConstants.REORDER_LAYERS:
      case layerConstants.REORDER_OVERLAY_GROUPS:
      case compareConstants.TOGGLE_ON_OFF:
      case compareConstants.CHANGE_MODE:
        reloadLayers();
        preloadForCompareMode();
        return;
      case CHANGE_PROJECTION:
        return updateProjection();
      case paletteConstants.SET_THRESHOLD_RANGE_AND_SQUASH:
      case paletteConstants.SET_CUSTOM:
      case paletteConstants.SET_DISABLED_CLASSIFICATION:
      case paletteConstants.CLEAR_CUSTOM:
      case layerConstants.ADD_LAYERS_FOR_EVENT:
        return setTimeout(reloadLayers, 100);
      case vectorStyleConstants.SET_FILTER_RANGE:
      case vectorStyleConstants.SET_VECTORSTYLE:
      case vectorStyleConstants.CLEAR_VECTORSTYLE:
      case SET_SCREEN_INFO:
        console.log('resize event');
        return onResize();
      case vectorStyleConstants.SET_SELECTED_VECTORS: {
        const type = 'selection';
        const newSelection = action.payload;
        updateVectorSelection(
          action.payload,
          ui.selectedVectors,
          getActiveLayers(state),
          type,
          state,
        );
        ui.selectedVectors = newSelection;
        return;
      }
      case STOP_ANIMATION:
      case EXIT_ANIMATION:
        return onStopAnimation();
      case dateConstants.CHANGE_CUSTOM_INTERVAL:
      case dateConstants.CHANGE_INTERVAL:
        return preloadNextTiles();
      case dateConstants.SELECT_DATE:
        if (ui.processingPromise) {
          return new Promise((resolve) => {
            resolve(ui.processingPromise);
          }).then(() => {
            ui.processingPromise = null;
            return updateDate(action.outOfStep);
          });
        }
        return updateDate(action.outOfStep);
      case layerConstants.TOGGLE_LAYER_VISIBILITY:
      case layerConstants.TOGGLE_OVERLAY_GROUP_VISIBILITY: {
        updateDate();
        break;
      }
      case dateConstants.ARROW_DOWN:
        bufferQuickAnimate(action.value);
        break;
      default:
        break;
    }
  };

  events.on(REDUX_ACTION_DISPATCHED, subscribeToStore);
  events.on(MAP_DISABLE_CLICK_ZOOM, () => {
    doubleClickZoom.setActive(false);
  });
  events.on(MAP_ENABLE_CLICK_ZOOM, () => {
    setTimeout(() => {
      doubleClickZoom.setActive(true);
    }, 100);
  });
  window.addEventListener('orientationchange', () => {
    setTimeout(() => { updateProjection(true); }, 200);
  });

  // Initial hook that initiates the map after it has been created in CreateMap.js
  useEffect(() => {
    if (document.getElementById('app')) {
      console.log('2. Initiating');
      updateProjection(true);
    }
  }, []);

  const updateExtent = () => {
    const map = ui.selected;
    const view = map.getView();
    const extent = view.calculateExtent();
    updateMapExtent(extent);
    if (map.isRendered()) {
      clearPreload();
    }
  };

  const updateLayerVisibilities = () => {
    const state = store.getState();
    const layerGroup = ui.selected.getLayers();

    const setRenderable = (layer, parentCompareGroup) => {
      const { id, group } = layer.wv;
      const dateGroup = layer.get('date') || group === 'active' ? 'selected' : 'selectedB';
      const date = getSelectedDate(state, dateGroup);
      const layers = getActiveLayers(state, parentCompareGroup || group);
      const renderable = isRenderableLayer(id, layers, date, null, state);
      layer.setVisible(renderable);
    };

    layerGroup.forEach((layer) => {
      const compareActiveString = layer.get('group');
      const granule = layer.get('granuleGroup');

      // Not in A|B
      if (layer.wv && !granule) {
        setRenderable(layer);

      // If in A|B layer-group will have a 'group' string
      } else if (compareActiveString || granule) {
        const compareGrouplayers = layer.getLayers().getArray();

        compareGrouplayers.forEach((subLayer) => {
          if (!subLayer.wv) {
            return;
          }
          // TileLayers within granule LayerGroup
          if (subLayer.get('granuleGroup')) {
            const granuleLayers = subLayer.getLayers().getArray();
            granuleLayers.forEach((l) => setRenderable(l));
            subLayer.setVisible(true);
          }
          setRenderable(subLayer, compareActiveString);
        });

        layer.setVisible(true);
      }
    });
  };

  const findLayer = useCallback((def, activeCompareState) => {
    const layers = ui.selected.getLayers().getArray();
    let layer = lodashFind(layers, {
      wv: {
        id: def.id,
      },
    });

    if (!layer && layers.length && (layers[0].get('group') || layers[0].get('granuleGroup'))) {
      let olGroupLayer;
      const layerKey = `${def.id}-${activeCompareState}`;
      lodashEach(layers, (layerGroup) => {
        if (layerGroup.get('layerId') === layerKey || layerGroup.get('group') === activeCompareState) {
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
  }, []);


 /**
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
    document.getElementById(`${map.getTarget()}`).style.display = 'none';
  }


  /**
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
    document.getElementById(`${map.getTarget()}`).style.display = 'block';
  }

  /**
 * When page is resized set for mobile or desktop
 *
 * @method onResize
 * @static
 *
 * @returns {void}
 */
  function onResize() {
    const map = ui.selected;
    if (isMobile) {
      map.removeControl(map.wv.scaleImperial);
      map.removeControl(map.wv.scaleMetric);
    } else {
      map.addControl(map.wv.scaleImperial);
      map.addControl(map.wv.scaleMetric);
    }
  }

 /**
 * Get granule options for layerBuilding
 * @param {object} state
 * @param {Object} def
 * @param {String} layerGroupStr
 * @param {Object} options
 * @returns {Object}
 */
  const getGranuleOptions = (state, { id, count, type }, activeString, options) => {
    if (type !== 'granule') return {};
    const reset = options && options.reset === id;

    // TODO update
    const granuleState = getGranuleLayer(state, id, activeString);
    let granuleDates;
    let granuleCount;
    let geometry;
    if (granuleState) {
      granuleDates = !reset ? granuleState.dates : false;
      granuleCount = granuleState.count;
      geometry = granuleState.geometry;
    }
    return {
      granuleDates,
      granuleCount: granuleCount || count,
      geometry,
    };
  };

  /**
   * @method reloadLayers
   *
   * @param {object} map - Openlayers Map obj
   * @param {Object} granuleOptions (optional: only used for granule layers)
   *   @param {Boolean} granuleDates - array of granule dates
   *   @param {Boolean} id - layer id
   * @returns {void}
   */

  async function reloadLayers(granuleOptions) {
    console.log('reloading layers');
    const map = ui.selected;
    const { createLayer } = ui;
    const state = { layers, compare, proj };

    if (!config.features.compare || !compare.active) {
      const compareMapDestroyed = !compare.active && compareMapUi.active;
      if (compareMapDestroyed) {
        compareMapUi.destroy();
      }
      clearLayers();
      const defs = getLayers(state, { reverse: true });
      const layerPromises = defs.map((def) => {
        const options = getGranuleOptions(state, def, compare.activeString, granuleOptions);
        return createLayer(def, options);
      });
      const createdLayers = await Promise.all(layerPromises);
      lodashEach(createdLayers, (l) => { map.addLayer(l); });
    } else {
      const stateArray = [['active', 'selected'], ['activeB', 'selectedB']];
      if (compare && !compare.isCompareA && compare.mode === 'spy') {
        stateArray.reverse(); // Set Layer order based on active A|B group
      }
      clearLayers();
      const stateArrayGroups = stateArray.map(async (arr) => getCompareLayerGroup(arr, state, granuleOptions));
      const compareLayerGroups = await Promise.all(stateArrayGroups);
      compareLayerGroups.forEach((layerGroup) => map.addLayer(layerGroup));
      compareMapUi.create(map, compare.mode);
    }
    updateLayerVisibilities();
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
  const clearLayers = function() {
    console.log('clearing layer');
    const activeLayers = ui.selected
      .getLayers()
      .getArray()
      .slice(0);
    lodashEach(activeLayers, (mapLayer) => {
      ui.selected.removeLayer(mapLayer);
    });
    ui.cache.clear();
  };

  /**
 * Create a Layergroup given the date and layerGroups
 */
  async function getCompareLayerGroup([compareActiveString, compareDateString], state, granuleOptions) {
    const { createLayer } = ui;
    const compareSideLayers = getActiveLayers(state, compareActiveString);
    const layers = getLayers(state, { reverse: true }, compareSideLayers)
      .map(async (def) => {
        const options = {
          ...getGranuleOptions(state, def, compareActiveString, granuleOptions),
          date: getSelectedDate(state, compareDateString),
          group: compareActiveString,
        };
        return createLayer(def, options);
      });
    const compareLayerGroup = await Promise.all(layers);

    return new OlLayerGroup({
      layers: compareLayerGroup,
      date: getSelectedDate(state, compareDateString),
      group: compareActiveString,
    });
  }

  const flyToNewExtent = function(extent, rotation) {
    const coordinateX = extent[0] + (extent[2] - extent[0]) / 2;
    const coordinateY = extent[1] + (extent[3] - extent[1]) / 2;
    const coordinates = [coordinateX, coordinateY];
    const resolution = ui.selected.getView().getResolutionForExtent(extent);
    const zoom = ui.selected.getView().getZoomForResolution(resolution);
    // Animate to extent, zoom & rotate:
    // Don't animate when an event is selected (Event selection already animates)
    return fly(ui.selected, proj, coordinates, zoom, rotation);
  };

  /**
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
    console.log('updating projection');
    if (ui.selected) {
      // Keep track of center point on projection switch
      ui.selected.previousCenter = ui.selected.center;
      hideMap(ui.selected);
    }
    ui.selected = ui.proj[proj.id];
    const map = ui.selected;

    const isProjectionRotatable = proj.id !== 'geographic' && proj.id !== 'webmerc';
    const currentRotation = isProjectionRotatable ? map.getView().getRotation() : 0;
    const rotationStart = isProjectionRotatable ? models.map.rotation : 0;
    const rotation = start ? rotationStart : currentRotation;

    // redux action
    updateMapUI(ui, rotation);

    // component function
    reloadLayers();

    // If the browser was resized, the inactive map was not notified of
    // the event. Force the update no matter what and reposition the center
    // using the previous value.
    // component function
    showMap(map);

    // ui.selected.updateSize() is what is really being called
    map.updateSize();

    if (ui.selected.previousCenter) {
      ui.selected.setCenter(ui.selected.previousCenter);
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
          const view = map.getView();
          const extent = view.calculateExtent(map.getSize());
          fitToLeadingExtent(extent);
        };
      }
      if (projId !== 'geographic') {
        callback = () => {
          const view = map.getView();
          view.setRotation(rotationStart);
        };
      }
      if (extent) {
        map.getView().fit(extent, {
          constrainResolution: false,
          callback,
        });
      } else if (rotationStart && projId !== 'geographic') {
        callback();
      }
    }
    updateExtent();
    onResize();
  // handleActiveMapMarker(start);
  }

 /**
 * During animation we swap Vector tiles for WMS for better performance.
 * Once animation completes, we need to call reloadLayers to reload and replace
 * the WMS tiles with Vector tiles.
 *
 * We also disable granule layer state updates due to performance reasons and so
 * need to trigger a layer state update once animation fisnishes.
 */
  const onStopAnimation = function() {
    const needsRefresh = activeLayers.some(({ type }) => type === 'granule' || type === 'vector');
    if (needsRefresh) {
      // The SELECT_DATE and STOP_ANIMATION actions happen back to back and both
      // try to modify map layers asynchronously so we need to set a timeout to allow
      // the updateDate() function to complete before trying to call reloadLayers() here
      setTimeout(reloadLayers, 100);
    }
  };

  const updateGranuleLayerOpacity = (def, activeStr, opacity, compare) => {
    const { id } = def;
    const layers = ui.selected.getLayers().getArray();
    lodashEach(Object.keys(layers), (index) => {
      const layer = layers[index];
      if (layer.className_ === 'ol-layer') {
        if (compare && compare.active) {
          const layerGroup = layer.getLayers().getArray();
          lodashEach(Object.keys(layerGroup), (groupIndex) => {
            const compareLayerGroup = layerGroup[groupIndex];
            if (compareLayerGroup.wv.id === id) {
              const tileLayer = compareLayerGroup.getLayers().getArray();

              // inner first granule group tile layer
              const firstTileLayer = tileLayer[0];
              if (firstTileLayer.wv.id === id) {
                if (firstTileLayer.wv.group === activeStr) {
                  compareLayerGroup.setOpacity(opacity);
                }
              }
            }
          });
        } else if (layer.wv.id === id) {
          if (layer.wv.group === activeStr) {
            layer.setOpacity(opacity);
          }
        }
      }
    });
  };

  function updateVectorStyles (def) {
    const state = store.getState();
    const activeLayers = getActiveLayers(state);
    const { vectorStyles } = config;
    const layerName = def.layer || def.id;
    let vectorStyleId;

    vectorStyleId = def.vectorStyle.id;
    if (activeLayers) {
      activeLayers.forEach((layer) => {
        if (layer.id === layerName && layer.custom) {
          vectorStyleId = layer.custom;
        }
      });
    }
    setStyleFunction(def, vectorStyleId, vectorStyles, null, state);
  }

  async function updateCompareLayer (def, index, layerCollection) {
    const state = store.getState();
    const { compare } = state;
    const options = {
      group: compare.activeString,
      date: getSelectedDate(state),
      ...getGranuleOptions(state, def, compare.activeString),
    };
    const updatedLayer = await createLayer(def, options);
    layerCollection.setAt(index, updatedLayer);
    compareMapUi.update(compare.activeString);
  }

   /**
   * Sets new opacity to layer
   * @param {object} def - layer Specs
   * @param {number} value - number value
   * @returns {void}
   */
  function updateOpacity(action) {
    const { id, opacity } = action;
    const state = store.getState();
    const { compare } = state;
    const activeStr = compare.isCompareA ? 'active' : 'activeB';
    const def = lodashFind(getActiveLayers(state), { id });
    if (def.type === 'granule') {
      updateGranuleLayerOpacity(def, activeStr, opacity, compare);
    } else {
      const layerGroup = findLayer(def, activeStr);
      layerGroup.getLayersArray().forEach((l) => {
        l.setOpacity(opacity);
      });
    }
    updateLayerVisibilities();
  }

  function preloadForCompareMode() {
    preloadNextTiles(selectedDate, 'active');
    if (compare.active) {
      preloadNextTiles(selectedDateB, 'activeB');
    }
  }

  function findLayerIndex({ id }) {
    const state = store.getState();
    const layerGroup = getActiveLayerGroup(state);
    const layers = layerGroup.getLayers().getArray();
    return lodashFindIndex(layers, {
      wv: { id },
    });
  }

  async function updateDate(outOfStepChange) {
    console.log('updating date');
    const { createLayer } = ui;
    const state = store.getState();
    const { compare = {} } = state;
    const layerGroup = getActiveLayerGroup(state);
    const mapLayerCollection = layerGroup.getLayers();
    const layers = mapLayerCollection.getArray();
    const activeLayers = getAllActiveLayers(state);
    const visibleLayers = activeLayers.filter(
      ({ id }) => layers
        .map(({ wv }) => lodashGet(wv, 'def.id'))
        .includes(id),
    ).filter(({ visible }) => visible);

    const layerPromises = visibleLayers.map(async (def) => {
      const { id, type } = def;
      const temporalLayer = ['subdaily', 'daily', 'monthly', 'yearly']
        .includes(def.period);
      const index = findLayerIndex(def);
      const hasVectorStyles = config.vectorStyles && lodashGet(def, 'vectorStyle.id');

      if (compare.active && layers.length) {
        await updateCompareLayer(def, index, mapLayerCollection);
      } else if (temporalLayer) {
        if (index !== undefined && index !== -1) {
          const layerValue = layers[index];
          const layerOptions = type === 'granule'
            ? { granuleCount: getGranuleCount(state, id) }
            : { previousLayer: layerValue ? layerValue.wv : null };
          const updatedLayer = await createLayer(def, layerOptions);
          mapLayerCollection.setAt(index, updatedLayer);
        }
      }
      if (hasVectorStyles && temporalLayer) {
        updateVectorStyles(def);
      }
    });
    await Promise.all(layerPromises);
    updateLayerVisibilities();
    if (!outOfStepChange) {
      preloadNextTiles();
    }
  }

  async function bufferQuickAnimate(arrowDown) {
    const BUFFER_SIZE = 8;
    const preloadPromises = [];
    const state = store.getState();
    const { preloaded, lastPreloadDate } = state.date;
    const selectedDate = getSelectedDate(state);
    const currentBuffer = preloaded ? getNumberStepsBetween(state, selectedDate, lastPreloadDate) : 0;

    if (currentBuffer >= BUFFER_SIZE) {
      return;
    }

    const currentDate = preloaded ? lastPreloadDate : selectedDate;
    const direction = arrowDown === 'right' ? 1 : -1;
    let nextDate = getNextDateTime(state, direction, currentDate);

    for (let step = 1; step <= BUFFER_SIZE; step += 1) {
      preloadPromises.push(promiseImageryForTime(state, nextDate));
      if (step !== BUFFER_SIZE) {
        nextDate = getNextDateTime(state, direction, nextDate);
      }
    }
    await Promise.all(preloadPromises);

    store.dispatch({
      type: dateConstants.SET_PRELOAD,
      preloaded: true,
      lastPreloadDate: nextDate,
    });
  }

  async function preloadNextTiles(date, compareString) {
    const useActiveString = compareString || activeString;
    const subsequentDate = lastArrowDirection === 'right' ? nextDate : prevDate;
    if (preloaded && lastArrowDirection) {
      setPreload(preloaded, subsequentDate);
      layerQueue.add(() => promiseImageryForTime(state, subsequentDate, useActiveString));
      return;
    }
    layerQueue.add(() => promiseImageryForTime(state, nextDate, useActiveString));
    layerQueue.add(() => promiseImageryForTime(state, prevDate, useActiveString));
    if (!date && !arrowDown) {
      preloadNextTiles(subsequentDate, useActiveString);
    }
  }

  const testFunction = () => {
  // console.log('map', map.ui.selected.getLayers() )
    console.log('map', map.ui);
    console.log('ui', ui.selected.getLayers());
    console.log('active layers', activeLayers);
  };

  const buttonStyle = {
    zIndex: '99',
  };

  return (
    <>
      <div className="d-flex justify-content-center w-100">
        <button className="btn btn-success" onClick={testFunction} style={buttonStyle}>SHOW MYMAP OBJ</button>
      </div>
      <Markers action={markerAction} ui={ui} config={config} />
      <GranuleHover granuleFootprints={granuleFootprints} ui={ui} />
      <CreateMap
        compareMapUi={compareMapUi}
        isMapSet={isMapSet}
        setMap={setMap}
        ui={ui}
        setUI={setUI}
        config={config}
        setGranuleFootprints={setGranuleFootprints}
        layerQueue={layerQueue}
        updateExtent={updateExtent}
        preloadNextTiles={preloadNextTiles}
      />
      <RemoveLayer action={removeLayerAction} updateLayerVisibilities={updateLayerVisibilities} findLayer={findLayer} />
      <AddLayer
        def={addLayerAction}
        preloadNextTiles={preloadNextTiles}
        updateLayerVisibilities={updateLayerVisibilities}
        ui={ui}
      />
    </>
  );
};

const mapStateToProps = (state, ownProps) => {
  const {
    map, compare, date, proj, layers, screenSize,
  } = state;
  const {
    lastPreloadDate, preloaded, lastArrowDirection, arrowDown, selected, selectedB,
  } = date;
  const isMobile = screenSize.isMobileDevice;
  const activeLayers = getActiveLayers(state);
  const selectedDate = selected;
  const selectedDateB = selectedB;
  const { activeString } = compare;
  const useDate = selectedDate || (preloaded ? lastPreloadDate : getSelectedDate(state));
  const nextDate = getNextDateTime(state, 1, useDate);
  const prevDate = getNextDateTime(state, -1, useDate);

  return {
    activeLayers,
    activeString,
    arrowDown,
    compare,
    compare,
    isMobile,
    lastArrowDirection,
    layers,
    map,
    nextDate,
    preloaded,
    prevDate,
    proj,
    selectedDate,
    selectedDateB,
    state,
  };
};

const mapDispatchToProps = (dispatch) => ({
  clearPreload: () => {
    dispatch(clearPreload());
  },
  fitToLeadingExtent: (extent) => {
    dispatch(fitToLeadingExtent(extent));
  },
  updateMapExtent: (extent) => {
    dispatch(updateMapExtent(extent));
  },
  updateMapUI: (ui, rotation) => {
    dispatch(updateMapUI(ui, rotation));
  },
  setPreload: (preloaded, lastPreloadDate) => ({
    config,
    preloaded,
    lastPreloadDate,
  }),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MapUI);
