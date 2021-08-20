/* eslint-disable no-multi-assign */
import ReactDOM from 'react-dom';
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
import { CALCULATE_RESPONSIVE_STATE } from 'redux-responsive';
import Cache from 'cachai';
import Queue from 'promise-queue';
import mapDateLineBuilder from './datelinebuilder';
import mapLayerBuilder from './layerbuilder';
import MapRunningData from './runningdata';
import { getActiveLayerGroup, saveRotation } from './util';
import mapCompare from './compare/compare';
import { LOCATION_POP_ACTION } from '../redux-location-state-customs';
import { CHANGE_PROJECTION } from '../modules/projection/constants';
import {
  CLEAR_MARKER,
  SET_MARKER,
  SET_REVERSE_GEOCODE_RESULTS,
  TOGGLE_DIALOG_VISIBLE,
} from '../modules/location-search/constants';
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
  isRenderable as isRenderableLayer,
  getMaxZoomLevelLayerCollection,
  getAllActiveLayers,
} from '../modules/layers/selectors';
import { getSelectedDate } from '../modules/date/selectors';
import { getNumberStepsBetween, getNextDateTime } from '../modules/date/util';
import { EXIT_ANIMATION, STOP_ANIMATION } from '../modules/animation/constants';
import {
  RENDERED, UPDATE_MAP_UI, UPDATE_MAP_EXTENT, UPDATE_MAP_ROTATION, FITTED_TO_LEADING_EXTENT, REFRESH_ROTATE, CLEAR_ROTATE,
} from '../modules/map/constants';
import { getLeadingExtent, promiseImageryForTime } from '../modules/map/util';
import { updateVectorSelection } from '../modules/vector-styles/util';
import { hasVectorLayers } from '../modules/layers/util';
import { animateCoordinates, getCoordinatesMarker } from '../modules/location-search/util';
import { reverseGeocode } from '../modules/location-search/util-api';
import { getCoordinatesMetadata, renderCoordinatesDialog } from '../components/location-search/ol-coordinates-marker-util';


const { events } = util;

export default function mapui(models, config, store, ui) {
  const animationDuration = 250;
  const dateline = mapDateLineBuilder(store);
  const compareMapUi = mapCompare(store);
  const runningdata = new MapRunningData(models, compareMapUi, store);
  const doubleClickZoom = new OlInteractionDoubleClickZoom({
    duration: animationDuration,
  });
  const cache = new Cache(400);
  const layerQueue = new Queue(5, Infinity);
  const { createLayer, layerKey } = mapLayerBuilder(config, cache, store);
  const self = {
    cache,
    mapIsbeingDragged: false,
    mapIsbeingZoomed: false,
    proj: {}, // One map for each projection
    selected: null, // The map for the selected projection
    selectedVectors: {},
    activeMarker: null,
    coordinatesDialogDOMEl: null,
    runningdata,
    layerKey,
    createLayer,
  };

  /**
   * Subscribe to redux store and listen for
   * specific action types
   */
  const subscribeToStore = function(action) {
    const state = store.getState();
    switch (action.type) {
      case layerConstants.ADD_LAYER: {
        const def = lodashFind(action.layers, { id: action.id });
        store.dispatch({ type: dateConstants.CLEAR_PRELOAD });
        return addLayer(def);
      }
      case CLEAR_MARKER:
        return removeCoordinatesMarker();
      case SET_MARKER: {
        return addMarkerAndUpdateStore(null, action.isInputSearch);
      }
      case TOGGLE_DIALOG_VISIBLE: {
        if (action.value) {
          addCoordinatesTooltip();
        } else {
          removeCoordinatesTooltip();
        }
        return;
      }
      case CLEAR_ROTATE: {
        self.selected.getView().animate({
          duration: 500,
          rotation: 0,
        });
        return;
      }
      case REFRESH_ROTATE: {
        self.selected.getView().animate({
          rotation: action.rotation,
          duration: 500,
        });
        return;
      }
      case LOCATION_POP_ACTION: {
        const newState = util.fromQueryString(action.payload.search);
        const extent = lodashGet(state, 'map.extent');
        const rotate = lodashGet(state, 'map.rotation') || 0;
        updateProjection();
        if (newState.v && !newState.e && extent) {
          flyToNewExtent(extent, rotate);
        }
        return;
      }
      case layerConstants.REMOVE_GROUP:
      case layerConstants.REMOVE_LAYER:
        return removeLayer(action.layersToRemove);
      case layerConstants.TOGGLE_LAYER_VISIBILITY:
      case layerConstants.TOGGLE_OVERLAY_GROUP_VISIBILITY: {
        updateLayerVisibilities();
        updateDate().then(preloadNextTiles);
        return;
      }

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
        return updateLookup();
      case vectorStyleConstants.SET_FILTER_RANGE:
      case vectorStyleConstants.SET_VECTORSTYLE:
      case vectorStyleConstants.CLEAR_VECTORSTYLE:
      case CALCULATE_RESPONSIVE_STATE:
        return onResize();
      case vectorStyleConstants.SET_SELECTED_VECTORS: {
        const type = 'selection';
        const newSelection = action.payload;
        updateVectorSelection(
          action.payload,
          self.selectedVectors,
          getActiveLayers(state), type, state,
        );
        self.selectedVectors = newSelection;
        return;
      }
      case STOP_ANIMATION:
      case EXIT_ANIMATION:
        return onStopAnimation();
      case dateConstants.CHANGE_CUSTOM_INTERVAL:
      case dateConstants.CHANGE_INTERVAL:
        return preloadNextTiles();
      case dateConstants.SELECT_DATE: {
        layerQueue.add(updateDate).then(preloadNextTiles);
        break;
      }
      case dateConstants.ARROW_DOWN:
        bufferQuickAnimate(action.value);
        break;
      default:
        break;
    }
  };

  const onStopAnimation = function() {
    const hasActiveVectors = hasVectorLayers(getActiveLayers(store.getState()));
    if (hasActiveVectors) {
      reloadLayers();
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
    events.on('map:disable-click-zoom', () => {
      doubleClickZoom.setActive(false);
    });
    events.on('map:enable-click-zoom', () => {
      setTimeout(() => {
        doubleClickZoom.setActive(true);
      }, 100);
    });
    events.on('redux:action-dispatched', subscribeToStore);
    events.on('map:reload-layers', reloadLayers);
    events.on('map:update-date', updateDate);
    updateProjection(true);
  };

  /*
   * Handle reverse geocode and add map marker with results
   *
   * @method handleActiveMapMarker
   * @static
   *
   * @returns {void}
   */
  const handleActiveMapMarker = (start) => {
    const state = store.getState();
    const { locationSearch } = state;
    const { coordinates, reverseGeocodeResults } = locationSearch;
    if (coordinates && coordinates.length > 0) {
      if (start) {
        reverseGeocode(coordinates, config).then((results) => {
          addMarkerAndUpdateStore(results);
        });
      } else {
        addMarkerAndUpdateStore(reverseGeocodeResults);
      }
    }
  };

  /*
   * Remove coordinates tooltip from all projections
   *
   * @method removeCoordinatesTooltip
   * @static
   *
   * @returns {void}
   */
  const removeCoordinatesTooltip = () => {
    const mapProjections = Object.keys(self.proj);
    mapProjections.forEach((mapProjection) => {
      const mapOverlays = self.proj[mapProjection].getOverlays().getArray();
      const coordinatesTooltipOverlay = mapOverlays.filter((overlay) => {
        const { id } = overlay;
        return id && id.includes('coordinates-map-marker');
      });
      if (coordinatesTooltipOverlay.length > 0) {
        self.proj[mapProjection].removeOverlay(coordinatesTooltipOverlay[0]);
      }
    });
  };

  /*
   * Remove coordinates marker
   *
   * @method removeCoordinatesMarker
   * @static
   *
   * @returns {void}
   */
  const removeCoordinatesMarker = () => {
    if (self.activeMarker) {
      self.activeMarker.setMap(null);
      self.selected.removeLayer(self.activeMarker);
    }
    // remove tooltip from all projections
    removeCoordinatesTooltip();
  };

  /*
   * Add map marker coordinate tooltip
   *
   * @method addCoordinatesTooltip
   * @static
   *
   * @param {Object} geocodeResults
   *
   * @returns {void}
   */
  const addCoordinatesTooltip = (geocodeResults) => {
    const state = store.getState();
    const {
      browser, locationSearch,
    } = state;
    const { coordinates, reverseGeocodeResults } = locationSearch;
    const results = geocodeResults || reverseGeocodeResults;
    const isMobile = browser.lessThan.medium;
    const [longitude, latitude] = coordinates;
    const geocodeProperties = { latitude, longitude, reverseGeocodeResults: results };
    const coordinatesMetadata = getCoordinatesMetadata(geocodeProperties);

    // handle clearing coordinates using created marker
    const clearMarker = () => {
      store.dispatch({ type: CLEAR_MARKER });
    };
    // handle toggling dialog visibility to retain preference between proj changes
    const toggleDialogVisible = (isVisible) => {
      store.dispatch({ type: TOGGLE_DIALOG_VISIBLE, value: isVisible });
    };

    // render coordinates dialog
    const coordinatesTooltipDOMEl = renderCoordinatesDialog(
      self.selected,
      config,
      [latitude, longitude],
      coordinatesMetadata,
      isMobile,
      clearMarker,
      toggleDialogVisible,
    );
    self.coordinatesDialogDOMEl = coordinatesTooltipDOMEl;
  };

  /*
   * Add map coordinate marker and update store
   *
   * @method addMarkerAndUpdateStore
   * @static
   *
   * @param {Object} geocodeResults
   * @param {Boolean} shouldFlyToCoordinates - if location search via input
   * @returns {void}
   */
  const addMarkerAndUpdateStore = (geocodeResults, shouldFlyToCoordinates) => {
    const state = store.getState();
    const { locationSearch, proj } = state;
    const {
      coordinates, isCoordinatesDialogOpen, reverseGeocodeResults,
    } = locationSearch;
    const results = geocodeResults || reverseGeocodeResults;
    const { sources } = config;

    // unmount coordinate dialog to prevent residual tooltips being hovered
    if (self.coordinatesDialogDOMEl) {
      ReactDOM.unmountComponentAtNode(self.coordinatesDialogDOMEl);
      self.coordinatesDialogDOMEl = null;
    }
    // clear previous marker (if present) and get new marker
    removeCoordinatesMarker();
    const marker = getCoordinatesMarker(proj, coordinates, results);

    // prevent marker if outside of extent
    if (!marker) {
      return false;
    }

    self.activeMarker = marker;
    self.selected.addLayer(marker);
    self.selected.renderSync();

    if (shouldFlyToCoordinates) {
      // fly to coordinates and render coordinates tooltip on init SET_MARKER
      const zoom = self.selected.getView().getZoom();
      const activeLayers = getActiveLayers(state).filter(({ projections }) => projections[proj.id]);
      const maxZoom = getMaxZoomLevelLayerCollection(activeLayers, zoom, proj.id, sources);
      animateCoordinates(self.selected, proj, coordinates, maxZoom);
    }

    // handle render initial tooltip
    const isDialogOpen = shouldFlyToCoordinates || isCoordinatesDialogOpen;
    if (isDialogOpen) {
      addCoordinatesTooltip(results);
    }

    store.dispatch({
      type: SET_REVERSE_GEOCODE_RESULTS,
      value: results,
    });
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

    const isProjectionRotatable = proj.id !== 'geographic' && proj.id !== 'webmerc';
    const currentRotation = isProjectionRotatable ? map.getView().getRotation() : 0;
    const rotationStart = isProjectionRotatable ? models.map.rotation : 0;

    store.dispatch({
      type: UPDATE_MAP_UI,
      ui: self,
      rotation: start ? rotationStart : currentRotation,
    });
    reloadLayers();

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
          const view = map.getView();
          const extent = view.calculateExtent(map.getSize());
          store.dispatch({ type: FITTED_TO_LEADING_EXTENT, extent });
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
    handleActiveMapMarker(start);
  }

  /*
   * When page is resized set for mobile or desktop
   *
   * @method onResize
   * @static
   *
   * @returns {void}
   */
  function onResize() {
    const state = store.getState();
    const { browser } = state;
    const isMobile = browser.lessThan.medium;
    const map = self.selected;

    if (isMobile) {
      map.removeControl(map.wv.scaleImperial);
      map.removeControl(map.wv.scaleMetric);
    } else {
      map.addControl(map.wv.scaleImperial);
      map.addControl(map.wv.scaleMetric);
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
    document.getElementById(`${map.getTarget()}`).style.display = 'none';
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
    document.getElementById(`${map.getTarget()}`).style.display = 'block';
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
  function reloadLayers(map) {
    map = map || self.selected;
    const state = store.getState();
    const { compare } = state;
    if (!config.features.compare || !compare.active) {
      const compareMapDestroyed = !compare.active && compareMapUi.active;
      if (compareMapDestroyed) {
        compareMapUi.destroy();
      }
      clearLayers(map);
      const defs = getLayers(state, { reverse: true });
      lodashEach(defs, (def) => {
        map.addLayer(createLayer(def));
      });
      // add active map marker back after destroying from layer/compare change
      if (self.activeMarker) {
        addMarkerAndUpdateStore();
      }
    } else {
      const stateArray = [['active', 'selected'], ['activeB', 'selectedB']];
      clearLayers(map);
      if (
        compare
        && !compare.isCompareA
        && compare.mode === 'spy'
      ) {
        stateArray.reverse(); // Set Layer order based on active A|B group
      }
      lodashEach(stateArray, (arr) => {
        map.addLayer(getCompareLayerGroup(arr, state));
      });
      compareMapUi.create(map, compare.mode);
      // add active map marker back in compare mode post createLayer
      if (self.activeMarker) {
        addMarkerAndUpdateStore();
      }
    }
    updateLayerVisibilities();
  }

  /**
   * Create a Layergroup given the date and layerGroups
   */
  function getCompareLayerGroup([compareActiveString, compareDateString], state) {
    const compareSideLayers = getActiveLayers(state, compareActiveString);
    const layers = getLayers(state, { reverse: true }, compareSideLayers)
      .filter(() => true)
      .map((def) => createLayer(def, {
        date: getSelectedDate(state, compareDateString),
        group: compareActiveString,
      }));
    return new OlLayerGroup({
      layers,
      group: compareActiveString,
      date: compareDateString,
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
    let renderable;
    const state = store.getState();
    const layers = self.selected.getLayers();
    layers.forEach((layer) => {
      const compareActiveString = layer.get('group');

      // Not in A|B
      if (layer.wv) {
        renderable = isRenderableLayer(
          layer.wv.id,
          getActiveLayers(state),
          getSelectedDate(state),
          null,
          state,
        );
        layer.setVisible(renderable);

        // If in A|B layer-group will have a 'group' string
      } else if (compareActiveString) {
        lodashEach(layer.getLayers().getArray(), (subLayer) => {
          if (!subLayer.wv) {
            return;
          }
          const compareDateString = layer.get('date');
          renderable = isRenderableLayer(
            subLayer.wv.id,
            getActiveLayers(state, compareActiveString),
            getSelectedDate(state, compareDateString),
            null,
            state,
          );
          subLayer.setVisible(renderable);
        });
        layer.setVisible(true);
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
    const def = lodashFind(getActiveLayers(state), {
      id: action.id,
    });
    const layer = findLayer(def, state.compare.activeString);

    layer.setOpacity(action.opacity);
    updateLayerVisibilities();
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
    const { compare } = state;
    date = date || getSelectedDate(state);
    activeLayers = activeLayers || getActiveLayers(state);
    const reverseLayers = lodashCloneDeep(activeLayers).reverse();
    const mapIndex = lodashFindIndex(reverseLayers, {
      id: def.id,
    });
    const mapLayers = self.selected.getLayers().getArray();
    const firstLayer = mapLayers[0];
    if (firstLayer && firstLayer.get('group')) {
      // Find which map layer-group is the active LayerGroup
      // and add layer to layerGroup in correct location
      const activelayer = firstLayer.get('group') === compare.activeString
        ? firstLayer
        : mapLayers[1];
      const newLayer = createLayer(def, {
        date,
        group: compare.activeString,
      });
      activelayer.getLayers().insertAt(mapIndex, newLayer);
      compareMapUi.create(self.selected, compare.mode);
    } else {
      self.selected.getLayers().insertAt(mapIndex, createLayer(def));
    }
    updateLayerVisibilities();
    preloadNextTiles();
  }

  function removeLayer(layersToRemove) {
    const state = store.getState();
    const { compare } = state;

    layersToRemove.forEach((def) => {
      const layer = findLayer(def, compare.activeString);
      if (compare && compare.active) {
        const layerGroup = getActiveLayerGroup(self.selected, compare.activeString);
        if (layerGroup) layerGroup.getLayers().remove(layer);
      } else {
        self.selected.removeLayer(layer);
      }
    });

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
  async function updateDate() {
    const state = store.getState();
    const { compare } = state;
    const activeLayers = getAllActiveLayers(state);
    let layerGroups;
    let layerGroup;

    if (compare && compare.active) {
      layerGroups = self.selected.getLayers().getArray();
      if (layerGroups.length > 1) {
        layerGroup = layerGroups[0].get('group') === compare.activeString
          ? layerGroups[0]
          : layerGroups[1].get('group') === compare.activeString
            ? layerGroups[1]
            : null;
      }
    }

    const group = compare && compare.active ? layerGroup : self.selected;
    const layers = group.getLayers().getArray();
    const visibleLayers = activeLayers.filter(
      ({ id }) => layers
        .filter((l) => l.getVisible())
        .map(({ wv }) => wv.def.id)
        .includes(id),
    );

    let mapLayers;
    let index;
    let prevLayer;
    let updatedLayer;

    const layerPromises = visibleLayers.map((def) => {
      const layerName = def.layer || def.id;
      let fadePromise = new Promise((resolve) => resolve());

      if (!['subdaily', 'daily', 'monthly', 'yearly'].includes(def.period)) {
        return fadePromise;
      }

      if (compare && compare.active) {
        if (layers.length) {
          index = findLayerIndex(def, layerGroup);
          mapLayers = layerGroup.getLayers();
          prevLayer = mapLayers.getArray()[index];
          updatedLayer = createLayer(def, {
            group: compare.activeString,
            date: getSelectedDate(state),
            previousLayer: prevLayer ? prevLayer.wv : null,
            fade: true,
          });
          mapLayers.insertAt(index, updatedLayer);
          compareMapUi.update(compare.activeString);
        }
      } else {
        index = findLayerIndex(def);
        mapLayers = self.selected.getLayers();
        prevLayer = layers[index];
        updatedLayer = createLayer(def, {
          previousLayer: prevLayer ? prevLayer.wv : null,
          fade: true,
        });
        mapLayers.insertAt(index, updatedLayer);
      }

      fadePromise = new Promise((resolve) => {
        updatedLayer.wv.fadeOut().then(() => {
          mapLayers.removeAt(index + 1);
          resolve();
        });
      });

      if (config.vectorStyles && def.vectorStyle && def.vectorStyle.id) {
        const { vectorStyles } = config;
        let vectorStyleId;

        vectorStyleId = def.vectorStyle.id;
        if (getActiveLayers(state)) {
          getActiveLayers(state).forEach((layer) => {
            if (layer.id === layerName && layer.custom) {
              vectorStyleId = layer.custom;
            }
          });
        }
        setStyleFunction(def, vectorStyleId, vectorStyles, null, state);
      }
      return fadePromise;
    });

    await Promise.all(layerPromises);
    updateLayerVisibilities();
  }


  /**
   * Preload tiles for the next and previous time interval so they are visible
   * as soon as the user changes the date. We will usually only end up actually requesting
   * either previous or next interval tiles since tiles are cached.
   * (e.g. user adjust from July 1 => July 2, we preload July 3 which is "next"
   * but no requests get made for "previous", July 1, since those are cached already.
   */
  async function preloadNextTiles(date, compareString) {
    const state = store.getState();
    const {
      lastPreloadDate, preloaded, lastArrowDirection, arrowDown,
    } = state.date;
    const { activeString } = state.compare;
    const useActiveString = compareString || activeString;
    const useDate = date || (preloaded ? lastPreloadDate : getSelectedDate(state));
    const nextDate = getNextDateTime(state, 1, useDate);
    const prevDate = getNextDateTime(state, -1, useDate);
    const subsequentDate = lastArrowDirection === 'right' ? nextDate : prevDate;

    // If we've preloaded N dates out, we need to use the latest
    // preloaded date the next time we call this function or the buffer
    // won't stay ahead of the 'animation' when holding down timetep arrows
    if (preloaded && lastArrowDirection) {
      store.dispatch({
        type: dateConstants.SET_PRELOAD,
        preloaded: true,
        lastPreloadDate: subsequentDate,
      });
      await promiseImageryForTime(state, subsequentDate, useActiveString);
      self.selected.getView().changed();
      return;
    }

    await promiseImageryForTime(state, nextDate, useActiveString);
    await promiseImageryForTime(state, prevDate, useActiveString);
    self.selected.getView().changed();

    if (!date && !arrowDown) {
      preloadNextTiles(nextDate, useActiveString);
      preloadNextTiles(prevDate, useActiveString);
    }
  }

  function preloadForCompareMode() {
    const { date, compare } = store.getState();
    const { selected, selectedB } = date;
    preloadNextTiles(selected, 'active');
    if (compare.active) {
      preloadNextTiles(selectedB, 'activeB');
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
   * @method findLayer
   * @static
   *
   * @param {object} def - Layer Specs
   *
   *
   * @returns {object} Layer object
   */
  function findLayer(def, activeCompareState) {
    const layers = self.selected.getLayers().getArray();
    let layer = lodashFind(layers, {
      wv: {
        id: def.id,
      },
    });

    if (!layer && layers.length && layers[0].get('group')) {
      let olGroupLayer;
      lodashEach(layers, (layerGroup) => {
        if (layerGroup.get('group') === activeCompareState) {
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

  const updateExtent = () => {
    const map = self.selected;
    const view = map.getView();
    const extent = view.calculateExtent(map.getSize());
    store.dispatch({ type: UPDATE_MAP_EXTENT, extent });
    if (map.isRendered()) {
      store.dispatch({ type: dateConstants.CLEAR_PRELOAD });
    }
  };

  /*
   * Create a map for a given projection
   *
   * @param {object} proj - Projection properties
   *
   * @returns {object} OpenLayers Map Object
   */
  function createMap(proj, dateSelected) {
    const state = store.getState();
    dateSelected = dateSelected || getSelectedDate(state);
    const id = `wv-map-${proj.id}`;
    const mapEl = document.createElement('div');
    mapEl.setAttribute('id', id);
    mapEl.setAttribute('data-proj', proj.id);
    mapEl.classList.add('wv-map');
    mapEl.style.display = 'none';

    document.getElementById('wv-map').insertAdjacentElement('afterbegin', mapEl);

    // Create two specific controls
    const scaleMetric = new OlControlScaleLine({
      className: 'wv-map-scale-metric',
      units: 'metric',
    });
    const scaleImperial = new OlControlScaleLine({
      className: 'wv-map-scale-imperial',
      units: 'imperial',
    });
    const rotateInteraction = new OlInteractionDragRotate({
      condition: altKeyOnly,
      duration: animationDuration,
    });
    const mobileRotation = new OlInteractionPinchRotate({
      duration: animationDuration,
    });
    const map = new OlMap({
      view: new OlView({
        maxResolution: proj.resolutions[0],
        projection: olProj.get(proj.crs),
        center: proj.startCenter,
        zoom: proj.startZoom,
        maxZoom: proj.numZoomLevels,
        enableRotation: true,
        extent: proj.id === 'geographic' ? [-250, -90, 250, 90] : proj.maxExtent,
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
      scaleMetric,
      scaleImperial,
    };
    map.proj = proj.id;
    createMousePosSel(map, proj);
    map.getView().on('change:resolution', () => {
      events.trigger('map:movestart');
    });

    // This component is inside the map viewport container. Allowing
    // mouse move events to bubble up displays map coordinates--let those
    // be blank when over a component.
    document.querySelector('.wv-map-scale-metric').addEventListener('mousemove', (e) => e.stopPropagation());
    document.querySelector('.wv-map-scale-imperial').addEventListener('mousemove', (e) => e.stopPropagation());

    // Allow rotation by dragging for polar projections
    if (proj.id !== 'geographic' && proj.id !== 'webmerc') {
      map.addInteraction(rotateInteraction);
      map.addInteraction(mobileRotation);
    } else if (proj.id === 'geographic') {
      dateline.init(map, dateSelected);
    }

    const onRotate = () => {
      const radians = map.getView().getRotation();
      store.dispatch({
        type: UPDATE_MAP_ROTATION,
        rotation: radians,
      });
      const currentDeg = radians * (180.0 / Math.PI);
      saveRotation(currentDeg, map.getView());
      updateExtent();
    };

    // Set event listeners for changes on the map view (when rotated, zoomed, panned)
    const debouncedUpdateExtent = lodashDebounce(updateExtent, 300);
    const debouncedOnRotate = lodashDebounce(onRotate, 300);

    map.getView().on('change:center', debouncedUpdateExtent);
    map.getView().on('change:resolution', debouncedUpdateExtent);
    map.getView().on('change:rotation', debouncedOnRotate);

    map.on('pointerdrag', () => {
      self.mapIsbeingDragged = true;
      events.trigger('map:drag');
    });
    map.getView().on('propertychange', (e) => {
      switch (e.key) {
        case 'resolution':
          self.mapIsbeingZoomed = true;
          events.trigger('map:zooming');
          break;
        default:
          break;
      }
    });
    map.on('moveend', (e) => {
      events.trigger('map:moveend');
      setTimeout(() => {
        self.mapIsbeingDragged = false;
        self.mapIsbeingZoomed = false;
      }, 200);
    });
    const onRenderComplete = () => {
      store.dispatch({ type: RENDERED });
      store.dispatch({
        type: UPDATE_MAP_UI,
        ui: self,
        rotation: self.selected.getView().getRotation(),
      });
      setTimeout(preloadForCompareMode, 250);
      map.un('rendercomplete', onRenderComplete);
    };
    map.on('rendercomplete', onRenderComplete);
    window.addEventListener('resize', () => {
      map.getView().changed();
    });

    return map;
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
    const throttledOnMouseMove = lodashThrottle((e) => {
      const state = store.getState();
      const { browser, sidebar } = state;
      const isMobile = browser.lessThan.medium;
      if (self.mapIsbeingZoomed) return;
      if (compareMapUi && compareMapUi.dragging) return;
      if (isMobile) return;
      if (state.measure.isActive) return;

      const pixels = map.getEventPixel(e);
      const coords = map.getCoordinateFromPixel(pixels);
      if (!coords) return;

      if (self.mapIsbeingDragged) return;
      // Don't add data runners if we're on the events or smart handoffs tabs, or if map is animating
      const isEventsTabActive = typeof state.events !== 'undefined' && state.events.active;
      const isMapAnimating = state.animation.isPlaying;
      if (isEventsTabActive || isMapAnimating || sidebar.activeTab === 'download') return;

      runningdata.newPoint(pixels, map);
    }, 300);

    events.on('map:mousemove', throttledOnMouseMove);
    events.on('map:mouseout', (e) => {
      throttledOnMouseMove.cancel();
      runningdata.clearAll();
    });
  }

  init();
  return {
    ...self,
    updateDate,
    reloadLayers,
  };
}
