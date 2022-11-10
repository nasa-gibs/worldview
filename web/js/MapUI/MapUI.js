import React, { useEffect, useState, useCallback } from 'react';
import { connect } from 'react-redux';
import Markers from './Components/Markers/Markers';
import GranuleHover from './Components/GranuleHover/GranuleHover';
import CreateMap from './Components/CreateMap/CreateMap';
import RemoveLayer from './Components/Layers/RemoveLayer'
import Layers from './Components/Layers/Layers'

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
  refreshRotation,
  updateMapExtent,
  updateRenderedState,
  updateMapUI,
} from '../modules/map/actions';
import { clearPreload, setPreload } from '../modules/date/actions';

const { events } = util;

const MapUI = (props) => {
  const {
    clearPreload,
    config,
    map,
    models,
    preloadNextTiles,
    setUI,
    store,
    ui,
    updateMapExtent,
  } = props;

  // useEffect(() => {
  //   console.log('mapUI rerendering')
  // })

  const [markerAction, setMarkerAction] = useState({});
  const [removeLayerAction, setRemoveLayerAction] = useState({})
  const [granuleFootprints, setGranuleFootprints] = useState({});
  const [isMapSet, setMap] = useState(false)

  const layerQueue = new PQueue({ concurrency: 3 });
  const compareMapUi = mapCompare(store);
  let uiCopy = ui;


  useEffect(() => {
  const createUI = (models, config, store, layerQueue) => {
    // COMMENT OUT LINES THAT ARE IN CREATEMAP.JS
    // REPLACE SELF WITH A COPY OF UI?
    console.log("2. createUI firing")
    uiCopy = ui;
    // const animationDuration = 250;
    // const granuleFootprintsObj = {};

    // const runningdata = new MapRunningData(compareMapUi, store);
    // const doubleClickZoom = new OlInteractionDoubleClickZoom({
    //   duration: animationDuration,
    // });
    const cache = uiCopy.cache;
    // const layerQueue = new PQueue({ concurrency: 3 });
    const createLayer = uiCopy.createLayer;
    // const self = {
    //   cache,
    //   mapIsbeingDragged: false,
    //   mapIsbeingZoomed: false,
    //   proj: {}, // One map for each projection
    //   selected: null, // The map for the selected projection
    //   selectedVectors: {},
    //   markers: [],
    //   runningdata,
    //   layerKey,
    //   createLayer,
    //   processingPromise: null,
    // };


    /**
   * Subscribe to redux store and listen for
   * specific action types
   */
    const subscribeToStore = function(action) {
      const state = store.getState();
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
            uiCopy.processingPromise = new Promise((resolve) => {
              resolve(addLayer(def));
            });
            return uiCopy.processingPromise;
          }
          store.dispatch({ type: dateConstants.CLEAR_PRELOAD });
          return addLayer(def);
        }
        case REMOVE_MARKER: {
          setMarkerAction(action);
        }
        //   return removeCoordinatesMarker(action.coordinates);
        case SET_MARKER: {
          setMarkerAction(action);
          // if (action.flyToExistingMarker) {
          //   return flyToMarker(action.coordinates);
          // }
          // return addMarkerAndUpdateStore(true, action.reverseGeocodeResults, action.isCoordinatesSearchActive, action.coordinates);
        }
        case TOGGLE_DIALOG_VISIBLE:
          setMarkerAction(action);
          // return addMarkerAndUpdateStore(false);
        case CLEAR_ROTATE: {
          uiCopy.selected.getView().animate({
            duration: 500,
            rotation: 0,
          });
          return;
        }
        case REFRESH_ROTATE: {
          uiCopy.selected.getView().animate({
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
          // return removeLayer(action.layersToRemove);
        return setRemoveLayerAction(action.layersToRemove)
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
          return onResize();
        case vectorStyleConstants.SET_SELECTED_VECTORS: {
          const type = 'selection';
          const newSelection = action.payload;
          updateVectorSelection(
            action.payload,
            uiCopy.selectedVectors,
            getActiveLayers(state),
            type,
            state,
          );
          uiCopy.selectedVectors = newSelection;
          return;
        }
        case STOP_ANIMATION:
        case EXIT_ANIMATION:
          return onStopAnimation();
        case dateConstants.CHANGE_CUSTOM_INTERVAL:
        case dateConstants.CHANGE_INTERVAL:
          return preloadNextTiles();
        case dateConstants.SELECT_DATE:
          if (uiCopy.processingPromise) {
            return new Promise((resolve) => {
              resolve(uiCopy.processingPromise);
            }).then(() => {
              uiCopy.processingPromise = null;
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

    // const onGranuleHover = (platform, date, update) => {
    //   const state = store.getState();
    //   const proj = self.selected.getView().getProjection().getCode();
    //   let geometry;
    //   if (platform && date) {
    //     geometry = getActiveGranuleFootPrints(state)[date];
    //   }
    //   granuleFootprintsObj[proj].addFootprint(geometry, date);
    // };

    // const onGranuleHoverUpdate = (platform, date) => {
    //   const state = store.getState();
    //   const proj = self.selected.getView().getProjection().getCode();
    //   let geometry;
    //   if (platform && date) {
    //     geometry = getActiveGranuleFootPrints(state)[date];
    //   }
    //   granuleFootprintsObj[proj].updateFootprint(geometry, date);
    // };

    /**
   * During animation we swap Vector tiles for WMS for better performance.
   * Once animation completes, we need to call reloadLayers to reload and replace
   * the WMS tiles with Vector tiles.
   *
   * We also disable granule layer state updates due to performance reasons and so
   * need to trigger a layer state update once animation fisnishes.
   */
    const onStopAnimation = function() {
      const state = store.getState();
      const activeLayers = getActiveLayers(state);
      const needsRefresh = activeLayers.some(({ type }) => type === 'granule' || type === 'vector');
      if (needsRefresh) {
      // The SELECT_DATE and STOP_ANIMATION actions happen back to back and both
      // try to modify map layers asynchronously so we need to set a timeout to allow
      // the updateDate() function to complete before trying to call reloadLayers() here
        setTimeout(reloadLayers, 100);
      }
    };

    const init = function() {
    // NOTE: iOS sometimes bombs if this is _.each instead. In that case,
    // it is possible that config.projections somehow becomes array-like.

    console.log("3. initiating");
      // lodashForOwn(config.projections, (proj) => {
      //   const map = createMap(proj);
      //   uiCopy.proj[proj.id] = map;
      // });
      events.on(MAP_DISABLE_CLICK_ZOOM, () => {
        doubleClickZoom.setActive(false);
      });
      events.on(MAP_ENABLE_CLICK_ZOOM, () => {
        setTimeout(() => {
          doubleClickZoom.setActive(true);
        }, 100);
      });
      events.on(REDUX_ACTION_DISPATCHED, subscribeToStore);
      // events.on(GRANULE_HOVERED, onGranuleHover);
      // events.on(GRANULE_HOVER_UPDATE, onGranuleHoverUpdate);
      window.addEventListener('orientationchange', () => {
        setTimeout(() => { updateProjection(true); }, 200);
      });
      updateProjection(true);
    };



    /*
   * Remove coordinates marker from all projections
   *
   * @method removeCoordinatesMarker
   * @static
   *
   * @returns {void}
   */
   //--------------------------------------------------------------
    // const removeCoordinatesMarker = (coordinatesObject) => {
    //   self.markers.forEach((marker) => {
    //     if (marker.id === coordinatesObject.id) {
    //       marker.setMap(null);
    //       self.selected.removeOverlay(marker);
    //     }
    //   });
    // };
   //--------------------------------------------------------------

    /*
   * Remove all coordinates markers
   *
   * @method removeAllCoordinatesMarkers
   * @static
   *
   * @returns {void}
   */
  //--------------------------------------------------------------
    // const removeAllCoordinatesMarkers = () => {
    //   self.markers.forEach((marker) => {
    //     marker.setMap(null);
    //     self.selected.removeOverlay(marker);
    //   });
    // };
   //--------------------------------------------------------------


    /*
   * Handle reverse geocode and add map marker with results
   *
   * @method handleActiveMapMarker
   * @static
   *
   * @returns {void}
   */
    //--------------------------------------------------------------
    // const handleActiveMapMarker = () => {
    //   const state = store.getState();
    //   const { locationSearch, proj } = state;
    //   const { coordinates } = locationSearch;
    //   removeAllCoordinatesMarkers();
    //   if (coordinates && coordinates.length > 0) {
    //     coordinates.forEach((coordinatesObject) => {
    //       const { longitude, latitude } = coordinatesObject;
    //       const coord = [longitude, latitude];
    //       if (!areCoordinatesWithinExtent(proj, coord)) return;
    //       reverseGeocode(getNormalizedCoordinate(coord), config).then((results) => {
    //         addMarkerAndUpdateStore(true, results, null, coordinatesObject);
    //       });
    //     });
    //   }
    // };
    //--------------------------------------------------------------

    //--------------------------------------------------------------
    // const flyToMarker = (coordinatesObject) => {
    //   const state = store.getState();
    //   const { proj } = state;
    //   const { sources } = config;
    //   const { longitude, latitude } = coordinatesObject;
    //   const latestCoordinates = coordinatesObject && [longitude, latitude];
    //   const zoom = self.selected.getView().getZoom();
    //   const activeLayers = getActiveLayers(state).filter(({ projections }) => projections[proj.id]);
    //   const maxZoom = getMaxZoomLevelLayerCollection(activeLayers, zoom, proj.id, sources);
    //   animateCoordinates(self.selected, proj, latestCoordinates, maxZoom);
    // };
    //--------------------------------------------------------------


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
   //--------------------------------------------------------------
    // const addMarkerAndUpdateStore = (showDialog, geocodeResults, shouldFlyToCoordinates, coordinatesObject) => {
    //   const state = store.getState();
    //   const { proj, screenSize } = state;
    //   const results = geocodeResults;
    //   if (!results) return;

    //   const remove = () => store.dispatch(removeMarker(coordinatesObject));
    //   const marker = getCoordinatesMarker(
    //     proj,
    //     coordinatesObject,
    //     results,
    //     remove,
    //     screenSize.isMobileDevice,
    //     showDialog,
    //   );

    //   // prevent marker if outside of extent
    //   if (!marker) {
    //     return false;
    //   }

    //   self.markers.push(marker);
    //   self.selected.addOverlay(marker);
    //   self.selected.renderSync();

    //   if (shouldFlyToCoordinates) {
    //     flyToMarker(coordinatesObject);
    //   }

    //   store.dispatch(setGeocodeResults(geocodeResults));
    // };
    //--------------------------------------------------------------

    const flyToNewExtent = function(extent, rotation) {
      const state = store.getState();
      const { proj } = state;
      const coordinateX = extent[0] + (extent[2] - extent[0]) / 2;
      const coordinateY = extent[1] + (extent[3] - extent[1]) / 2;
      const coordinates = [coordinateX, coordinateY];
      const resolution = uiCopy.selected.getView().getResolutionForExtent(extent);
      const zoom = uiCopy.selected.getView().getZoomForResolution(resolution);
      // Animate to extent, zoom & rotate:
      // Don't animate when an event is selected (Event selection already animates)
      return fly(uiCopy.selected, proj, coordinates, zoom, rotation);
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
      if (uiCopy.selected) {
      // Keep track of center point on projection switch
        uiCopy.selected.previousCenter = uiCopy.selected.center;
        hideMap(uiCopy.selected);
      }
      uiCopy.selected = uiCopy.proj[proj.id];
      const map = uiCopy.selected;

      const isProjectionRotatable = proj.id !== 'geographic' && proj.id !== 'webmerc';
      const currentRotation = isProjectionRotatable ? map.getView().getRotation() : 0;
      const rotationStart = isProjectionRotatable ? models.map.rotation : 0;

      store.dispatch({
        type: UPDATE_MAP_UI,
        ui: uiCopy,
        rotation: start ? rotationStart : currentRotation,
      });
      reloadLayers();

      // If the browser was resized, the inactive map was not notified of
      // the event. Force the update no matter what and reposition the center
      // using the previous value.
      showMap(map);
      map.updateSize();

      if (uiCopy.selected.previousCenter) {
        uiCopy.selected.setCenter(uiCopy.selected.previousCenter);
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
      // handleActiveMapMarker(start);
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
      const { screenSize } = state;
      const isMobile = screenSize.isMobileDevice;
      const map = uiCopy.selected;

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
    const clearLayers = function() {
      const activeLayers = uiCopy.selected
        .getLayers()
        .getArray()
        .slice(0);
      lodashEach(activeLayers, (mapLayer) => {
        uiCopy.selected.removeLayer(mapLayer);
      });
      cache.clear();
    };

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
   * @param {boolean} start - indicate init load
   * @returns {void}
   */

    async function reloadLayers(granuleOptions) {
      const map = uiCopy.selected;
      const state = store.getState();
      const { compare } = state;

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


    /**
   * Create a Layergroup given the date and layerGroups
   */
    async function getCompareLayerGroup([compareActiveString, compareDateString], state, granuleOptions) {
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

    /*
   * Function called when layers need to be updated
   * e.g: can be the result of new data or another display
   *
   * @method updateLayerVisibilities
   * @static
   *
   * @returns {void}
   */
    // function updateLayerVisibilities() {
    //   const state = store.getState();

    //   const layerGroup = uiCopy.selected.getLayers();

    //   console.log("uiCopy", layerGroup)

    //   const setRenderable = (layer, parentCompareGroup) => {
    //     const { id, group } = layer.wv;
    //     const dateGroup = layer.get('date') || group === 'active' ? 'selected' : 'selectedB';
    //     const date = getSelectedDate(state, dateGroup);
    //     const layers = getActiveLayers(state, parentCompareGroup || group);
    //     const renderable = isRenderableLayer(id, layers, date, null, state);
    //     layer.setVisible(renderable);
    //   };

    //   layerGroup.forEach((layer) => {
    //     const compareActiveString = layer.get('group');
    //     const granule = layer.get('granuleGroup');

    //     // Not in A|B
    //     if (layer.wv && !granule) {
    //       setRenderable(layer);

    //       // If in A|B layer-group will have a 'group' string
    //     } else if (compareActiveString || granule) {
    //       const compareGrouplayers = layer.getLayers().getArray();

    //       compareGrouplayers.forEach((subLayer) => {
    //         if (!subLayer.wv) {
    //           return;
    //         }
    //         // TileLayers within granule LayerGroup
    //         if (subLayer.get('granuleGroup')) {
    //           const granuleLayers = subLayer.getLayers().getArray();
    //           granuleLayers.forEach((l) => setRenderable(l));
    //           subLayer.setVisible(true);
    //         }
    //         setRenderable(subLayer, compareActiveString);
    //       });

    //       layer.setVisible(true);
    //     }
    //   });
    // }

    /*
   * Sets new opacity to granule layers
   *
   * @method updateGranuleLayerOpacity
   * @static
   *
   * @param {object} def
   * @param {sring} activeStr
   * @param {number} opacity
   * @param {object} compare
   *
   * @returns {void}
   */
    const updateGranuleLayerOpacity = (def, activeStr, opacity, compare) => {
      const { id } = def;
      const layers = uiCopy.selected.getLayers().getArray();
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

    /**
   * Initiates the adding of a layer
   * @param {object} def - layer Specs
   * @returns {void}
   */
    const addLayer = async function(def, date, activeLayers) {
      const state = store.getState();
      const { compare } = state;
      date = date || getSelectedDate(state);
      activeLayers = activeLayers || getActiveLayers(state);
      const reverseLayers = lodashCloneDeep(activeLayers).reverse();
      const index = lodashFindIndex(reverseLayers, { id: def.id });
      const mapLayers = uiCopy.selected.getLayers().getArray();
      const firstLayer = mapLayers[0];

      if (firstLayer && firstLayer.get('group') && firstLayer.get('granule') !== true) {
        const activelayer = firstLayer.get('group') === compare.activeString
          ? firstLayer
          : mapLayers[1];
        const options = {
          date,
          group: compare.activeString,
        };
        const newLayer = await createLayer(def, options);
        activelayer.getLayers().insertAt(index, newLayer);
        compareMapUi.create(uiCopy.selected, compare.mode);
      } else {
        const newLayer = await createLayer(def);
        uiCopy.selected.getLayers().insertAt(index, newLayer);
      }

      updateLayerVisibilities();
      preloadNextTiles();
    };


    // function removeLayer(layersToRemove) {
    //   console.log('removing layer')
    //   const state = store.getState();
    //   const { compare } = state;

    //   layersToRemove.forEach((def) => {
    //     const layer = findLayer(def, compare.activeString);
    //     if (compare && compare.active) {
    //       const layerGroup = getActiveLayerGroup(state);
    //       if (layerGroup) layerGroup.getLayers().remove(layer);
    //     } else {
    //       uiCopy.selected.removeLayer(layer);
    //     }
    //   });

    //   updateLayerVisibilities();
    // }

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

    async function updateDate(outOfStepChange) {
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
        layerQueue.add(() => promiseImageryForTime(state, subsequentDate, useActiveString));
        return;
      }

      layerQueue.add(() => promiseImageryForTime(state, nextDate, useActiveString));
      layerQueue.add(() => promiseImageryForTime(state, prevDate, useActiveString));

      if (!date && !arrowDown) {
        preloadNextTiles(subsequentDate, useActiveString);
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
    // function findLayer(def, activeCompareState) {
    //   const layers = uiCopy.selected.getLayers().getArray();
    //   let layer = lodashFind(layers, {
    //     wv: {
    //       id: def.id,
    //     },
    //   });

    //   if (!layer && layers.length && (layers[0].get('group') || layers[0].get('granuleGroup'))) {
    //     let olGroupLayer;
    //     const layerKey = `${def.id}-${activeCompareState}`;
    //     lodashEach(layers, (layerGroup) => {
    //       if (layerGroup.get('layerId') === layerKey || layerGroup.get('group') === activeCompareState) {
    //         olGroupLayer = layerGroup;
    //       }
    //     });
    //     const subGroup = olGroupLayer.getLayers().getArray();
    //     layer = lodashFind(subGroup, {
    //       wv: {
    //         id: def.id,
    //       },
    //     });
    //   }
    //   return layer;
    // }

    /*
   * Return an Index value for a layer in the OPenLayers layer array
   * @method findLayerIndex
   * @param {object} def - Layer Specs

   * @returns {number} Index of layer in OpenLayers layer array
   */
    function findLayerIndex({ id }) {
      const state = store.getState();
      const layerGroup = getActiveLayerGroup(state);
      const layers = layerGroup.getLayers().getArray();
      return lodashFindIndex(layers, {
        wv: { id },
      });
    }

    // const updateExtent = () => {
    //   const map = uiCopy.selected;
    //   const view = map.getView();
    //   const extent = view.calculateExtent();
    //   store.dispatch({ type: UPDATE_MAP_EXTENT, extent });
    //   if (map.isRendered()) {
    //     store.dispatch({ type: dateConstants.CLEAR_PRELOAD });
    //   }
    // };

    /*
   * Create map object
   *
   * @method createMap
   * @static
   *
   * @param {object} proj - Projection properties
   * @param {object} dateSelected
   *
   * @returns {object} OpenLayers Map Object
   */
    // function createMap(proj, dateSelected) {
    //   console.log("3. creating map")
    //   const state = store.getState();
    //   dateSelected = dateSelected || getSelectedDate(state);
    //   const mapContainerEl = document.getElementById('wv-map');
    //   const mapEl = document.createElement('div');
    //   const id = `wv-map-${proj.id}`;

    //   mapEl.setAttribute('id', id);
    //   mapEl.setAttribute('data-proj', proj.id);
    //   mapEl.classList.add('wv-map');
    //   mapEl.style.display = 'none';
    //   mapContainerEl.insertAdjacentElement('afterbegin', mapEl);


    //   // Create two specific controls
    //   const scaleMetric = new OlControlScaleLine({
    //     className: 'wv-map-scale-metric',
    //     units: 'metric',
    //   });
    //   const scaleImperial = new OlControlScaleLine({
    //     className: 'wv-map-scale-imperial',
    //     units: 'imperial',
    //   });
    //   const rotateInteraction = new OlInteractionDragRotate({
    //     condition: altKeyOnly,
    //     duration: animationDuration,
    //   });
    //   const mobileRotation = new OlInteractionPinchRotate({
    //     duration: animationDuration,
    //   });
    //   const map = new OlMap({
    //     view: new OlView({
    //       maxResolution: proj.resolutions[0],
    //       projection: olProj.get(proj.crs),
    //       center: proj.startCenter,
    //       zoom: proj.startZoom,
    //       maxZoom: proj.numZoomLevels,
    //       enableRotation: true,
    //       extent: proj.id === 'geographic' ? [-250, -90, 250, 90] : proj.maxExtent,
    //       constrainOnlyCenter: true,
    //     }),
    //     target: id,
    //     renderer: ['canvas'],
    //     logo: false,
    //     controls: [scaleMetric, scaleImperial],
    //     interactions: [
    //       doubleClickZoom,
    //       new OlInteractionDragPan({
    //         kinetic: new OlKinetic(-0.005, 0.05, 100),
    //       }),
    //       new OlInteractionPinchZoom({
    //         duration: animationDuration,
    //       }),
    //       new OlInteractionMouseWheelZoom({
    //         duration: animationDuration,
    //       }),
    //       new OlInteractionDragZoom({
    //         duration: animationDuration,
    //       }),
    //     ],
    //     loadTilesWhileAnimating: true,
    //     loadTilesWhileInteracting: true,
    //     maxTilesLoading: 32,
    //   });
    //   map.wv = {
    //     scaleMetric,
    //     scaleImperial,
    //   };
    //   map.proj = proj.id;
    //   createMousePosSel(map, proj);
    //   map.getView().on('change:resolution', () => {
    //     events.trigger(MAP_MOVE_START);
    //   });

    //   // This component is inside the map viewport container. Allowing
    //   // mouse move events to bubble up displays map coordinates--let those
    //   // be blank when over a component.
    //   document.querySelector('.wv-map-scale-metric').addEventListener('mousemove', (e) => e.stopPropagation());
    //   document.querySelector('.wv-map-scale-imperial').addEventListener('mousemove', (e) => e.stopPropagation());

    //   // Allow rotation by dragging for polar projections
    //   if (proj.id !== 'geographic' && proj.id !== 'webmerc') {
    //     map.addInteraction(rotateInteraction);
    //     map.addInteraction(mobileRotation);
    //   }

    //   const onRotate = () => {
    //     const radians = map.getView().getRotation();
    //     store.dispatch({
    //       type: UPDATE_MAP_ROTATION,
    //       rotation: radians,
    //     });
    //     const currentDeg = radians * (180.0 / Math.PI);
    //     saveRotation(currentDeg, map.getView());
    //     updateExtent();
    //   };

    //   // Set event listeners for changes on the map view (when rotated, zoomed, panned)
    //   const debouncedUpdateExtent = lodashDebounce(updateExtent, 300);
    //   const debouncedOnRotate = lodashDebounce(onRotate, 300);

    //   map.getView().on('change:center', debouncedUpdateExtent);
    //   map.getView().on('change:resolution', debouncedUpdateExtent);
    //   map.getView().on('change:rotation', debouncedOnRotate);

    //   map.on('pointerdrag', () => {
    //     uiCopy.mapIsbeingDragged = true;
    //     events.trigger(MAP_DRAG);
    //   });
    //   map.getView().on('propertychange', (e) => {
    //     switch (e.key) {
    //       case 'resolution':
    //         uiCopy.mapIsbeingZoomed = true;
    //         events.trigger(MAP_ZOOMING);
    //         break;
    //       default:
    //         break;
    //     }
    //   });
    //   map.on('moveend', (e) => {
    //     setTimeout(() => {
    //       uiCopy.mapIsbeingDragged = false;
    //       uiCopy.mapIsbeingZoomed = false;
    //     }, 200);
    //   });
    //   const onRenderComplete = () => {
    //     store.dispatch({ type: RENDERED });
    //     store.dispatch({
    //       type: UPDATE_MAP_UI,
    //       ui: uiCopy,
    //       rotation: uiCopy.selected.getView().getRotation(),
    //     });
    //     setTimeout(preloadForCompareMode, 250);
    //     map.un('rendercomplete', onRenderComplete);
    //   };

    //   map.on('loadstart', () => {
    //     store.dispatch(startLoading(MAP_LOADING));
    //   });
    //   map.on('loadend', () => {
    //     store.dispatch(stopLoading(MAP_LOADING));
    //   });
    //   map.on('rendercomplete', onRenderComplete);

    //   granuleFootprintsObj[proj.crs] = granuleFootprint(map);

    //   // This runs once for each projection and we can only set state once
    //   // using a plain object to track now but we may need to seperate into 3
    //   // state objects and combine

    //   setGranuleFootprints({
    //     ...granuleFootprintsObj,
    //     [proj.crs]: granuleFootprint(map)
    //   });
    //   window.addEventListener('resize', () => {
    //     map.getView().changed();
    //   });
    //   console.log(`map object for ${proj.crs}`, map);
    //   return map;
    // }

  //   /**
  //  * Creates map events based on mouse position
  //  * @param {object} map - OpenLayers Map Object
  //  * @returns {void}
  //  */
  //   function createMousePosSel(map) {
  //     console.log('testesttest')
  //     const throttledOnMouseMove = lodashThrottle(({ pixel }) => {
  //       const state = store.getState();
  //       const {
  //         events, locationSearch, sidebar, animation, measure, screenSize,
  //       } = state;
  //       const { isCoordinateSearchActive } = locationSearch;
  //       const isMobile = screenSize.isMobileDevice;
  //       const coords = map.getCoordinateFromPixel(pixel);
  //       const isEventsTabActive = typeof events !== 'undefined' && events.active;
  //       const isMapAnimating = animation.isPlaying;

  //       if (map.proj !== state.map.ui.selected.proj) return;
  //       if (uiCopy.mapIsbeingZoomed) return;
  //       if (uiCopy.mapIsbeingDragged) return;
  //       if (compareMapUi && compareMapUi.dragging) return;
  //       if (isMobile) return;
  //       if (measure.isActive) return;
  //       if (isCoordinateSearchActive) return;
  //       if (!coords) return;
  //       if (isEventsTabActive || isMapAnimating || sidebar.activeTab === 'download') return;

  //       runningdata.newPoint(pixel, map);
  //     }, 300);

  //     events.on(MAP_MOUSE_MOVE, throttledOnMouseMove);
  //     events.on(MAP_MOUSE_OUT, (e) => {
  //       throttledOnMouseMove.cancel();
  //       runningdata.clearAll();
  //     });
  //   }

    if (document.getElementById('app')) {
      init();
    }
    setUI(uiCopy)
    // return uiCopy;
  };
  if(ui){
    createUI(models, config, store, layerQueue)
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

const updateLayerVisibilities = useCallback(() => {
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
}, [])

const findLayer = useCallback((def, activeCompareState) =>{
  const layers = uiCopy.selected.getLayers().getArray();
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
}, [])

const testFunction = () => {
  // console.log('map', map.ui.selected.getLayers() )
  console.log('map', map.ui )
  console.log('ui', ui.selected.getLayers())
}

const buttonStyle = {
  zIndex: '99'
}

  return (
    <>
      <div className="d-flex justify-content-center w-100">
        <button className="btn btn-success" onClick={testFunction} style={buttonStyle}>SHOW MYMAP OBJ</button>
      </div>
      <Markers action={markerAction} ui={ui} config={config}/>
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
    </>
  );
};

const mapStateToProps = (state) => {
  const { map, compare, date } = state;
  const {
    lastPreloadDate, preloaded, lastArrowDirection, arrowDown,
  } = date;
  const selectedDate = date.selected
  const activeString = compare;
  const useDate = selectedDate || (preloaded ? lastPreloadDate : getSelectedDate(state));
  const nextDate = getNextDateTime(state, 1, useDate);
  const prevDate = getNextDateTime(state, -1, useDate);

  async function preloadNextTiles(date, compareString, layerQueue) {

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

  return {
    preloadNextTiles,
    map,
  };
};

const mapDispatchToProps = (dispatch) => ({
  clearPreload: () => {
    dispatch(clearPreload());
  },
  updateMapExtent: (extent) => {
    dispatch(updateMapExtent(extent));
  },
})

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MapUI);
