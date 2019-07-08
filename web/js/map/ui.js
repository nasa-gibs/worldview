
import lodashFindIndex from 'lodash/findIndex';
import lodashEach from 'lodash/each';
import lodashForOwn from 'lodash/forOwn';
import lodashThrottle from 'lodash/throttle';
import util from '../util/util';
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
import { MapRotate } from './rotation';
import { mapDateLineBuilder } from './datelinebuilder';
import { mapLayerBuilder } from './layerbuilder';
import { MapRunningData } from './runningdata';
import { mapPrecacheTile } from './precachetile';
import { mapUtilZoomAction, getActiveLayerGroup } from './util';
import { mapCompare } from './compare/compare';
import { CALCULATE_RESPONSIVE_STATE } from 'redux-responsive';
import { LOCATION_POP_ACTION } from '../redux-location-state-customs';
import { CHANGE_PROJECTION } from '../modules/projection/constants';
import { SELECT_DATE } from '../modules/date/constants';
import { openCustomContent } from '../modules/modal/actions';
import VectorMetaTable from '../components/vector-metadata/table';
import Cache from 'cachai';
import * as layerConstants from '../modules/layers/constants';
import * as compareConstants from '../modules/compare/constants';
import * as paletteConstants from '../modules/palettes/constants';
import * as vectorStyleConstants from '../modules/vector-styles/constants';
import {
  getLayers,
  isRenderable as isRenderableLayer
} from '../modules/layers/selectors';
import {
  get as lodashGet,
  debounce as lodashDebounce,
  cloneDeep as lodashCloneDeep,
  find as lodashFind
} from 'lodash';
import { CLEAR_ROTATE } from '../modules/map/constants';

export function mapui(models, config, store, ui) {
  var layerBuilder, createLayer;
  var id = 'wv-map';
  var selector = '#' + id;
  var animationDuration = 250;
  var self = {};
  var cache;
  var rotation = new MapRotate(self, models, store);
  var dateline = mapDateLineBuilder(models, config, store, ui);
  var precache = mapPrecacheTile(models, config, cache, self);
  var compareMapUi = mapCompare(config, store);
  var dataRunner = (self.runningdata = new MapRunningData(
    models,
    compareMapUi,
    store
  ));
  cache = self.cache = new Cache(400);
  self.mapIsbeingDragged = false;
  self.mapIsbeingZoomed = false;
  self.proj = {}; // One map for each projection
  self.selected = null; // The map for the selected projection
  self.events = util.events();
  layerBuilder = self.layerBuilder = mapLayerBuilder(
    models,
    config,
    cache,
    self,
    store
  );
  self.layerKey = layerBuilder.layerKey;
  createLayer = self.createLayer = layerBuilder.createLayer;
  self.promiseDay = precache.promiseDay;

  /**
   * Suscribe to redux store and listen for
   * specific action types
   */
  const subscribeToStore = function(action) {
    switch (action.type) {
      case layerConstants.ADD_LAYER:
        let def = lodashFind(action.layers, { id: action.id });
        return addLayer(def);
      case CLEAR_ROTATE:
        return rotation.reset(self.selected);
      case LOCATION_POP_ACTION:
        const newState = util.fromQueryString(action.payload.search);
        const extent = lodashGet(action, 'payload.query.map.extent');
        const rotate =
          lodashGet(action, 'payload.query.map.rotation') || 0;
        updateProjection();
        if (newState.v && !newState.e && extent) {
          flyToNewExtent(extent, rotate);
        }
        return;
      case layerConstants.REMOVE_LAYER:
        return removeLayer(action);
      case layerConstants.TOGGLE_LAYER_VISIBILITY:
        return updateLayerVisibilities(action);
      case layerConstants.UPDATE_OPACITY:
        return updateOpacity(action);
      case compareConstants.CHANGE_STATE:
        if (action.mode === 'spy') {
          return reloadLayers();
        }
        return;
      case layerConstants.REORDER_LAYER_GROUP:
      case compareConstants.TOGGLE_ON_OFF:
      case compareConstants.CHANGE_MODE:
        return reloadLayers();
      case CHANGE_PROJECTION:
        return updateProjection();
      case paletteConstants.SET_THRESHOLD_RANGE_AND_SQUASH:
      case paletteConstants.SET_CUSTOM:
      case paletteConstants.CLEAR_CUSTOM:
      case paletteConstants.REQUEST_PALETTE_SUCCESS:
        return updateLookup();
      case vectorStyleConstants.SET_FILTER_RANGE:
      case vectorStyleConstants.SET_VECTORSTYLE:
      case vectorStyleConstants.CLEAR_VECTORSTYLE:
      case CALCULATE_RESPONSIVE_STATE:
        return onResize();
      case SELECT_DATE:
        updateDate();
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
  var init = function() {
    // NOTE: iOS sometimes bombs if this is _.each instead. In that case,
    // it is possible that config.projections somehow becomes array-like.
    lodashForOwn(config.projections, function(proj) {
      var map = createMap(proj);
      self.proj[proj.id] = map;
    });
    models.map.events.on('update-layers', reloadLayers);
    ui.events.on('last-action', subscribeToStore);
    updateProjection(true);
  };
  const flyToNewExtent = function(extent, rotation) {
    let coordinateX = extent[0] + (extent[2] - extent[0]) / 2;
    let coordinateY = extent[1] + (extent[3] - extent[1]) / 2;
    let coordinates = [coordinateX, coordinateY];
    let resolution = self.selected.getView().getResolutionForExtent(extent);
    let zoom = self.selected.getView().getZoomForResolution(resolution);
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
  var updateProjection = function(start) {
    const state = store.getState();
    const { proj } = state;
    if (self.selected) {
      // Keep track of center point on projection switch
      self.selected.previousCenter = self.selected.center;
      hideMap(self.selected);
    }
    self.selected = self.proj[proj.id];
    var map = self.selected;
    let currentRotation = proj.id !== 'geographic' && proj.id !== 'webmerc' ? map.getView().getRotation() : 0;
    store.dispatch({ type: 'MAP/UPDATE_MAP_UI', ui: self, rotation: currentRotation });
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
      var projId = proj.selected.id;
      var extent = null;
      if (models.map.extent) {
        extent = models.map.extent;
      } else if (!models.map.extent && projId === 'geographic') {
        extent = models.map.getLeadingExtent();
      }
      if (extent) {
        map.getView().fit(extent, {
          constrainResolution: false
        });
      }
    }
    updateExtent();
    onResize();
  };
  /*
   * When page is resised set for mobile or desktop
   *
   * @method onResize
   * @static
   *
   * @returns {void}
   */
  var onResize = function() {
    var map = self.selected;
    if (map.small !== util.browser.small) {
      if (util.browser.small) {
        map.removeControl(map.wv.scaleImperial);
        map.removeControl(map.wv.scaleMetric);
        $('#' + map.getTarget() + ' .select-wrapper').hide();
      } else {
        map.addControl(map.wv.scaleImperial);
        map.addControl(map.wv.scaleMetric);
        $('#' + map.getTarget() + ' .select-wrapper').show();
      }
    }
  };
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
  var hideMap = function(map) {
    $('#' + map.getTarget()).hide();
  };
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
  var showMap = function(map) {
    $('#' + map.getTarget()).show();
  };
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
  var clearLayers = function(map) {
    var activeLayers = map
      .getLayers()
      .getArray()
      .slice(0);
    lodashEach(activeLayers, function(mapLayer) {
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
  var reloadLayers = self.reloadLayers = function(map) {
    map = map || self.selected;
    const state = store.getState();
    const { layers, proj } = state;
    const compareState = state.compare;
    var layerGroupStr = compareState.activeString;
    var activeLayers = layers[layerGroupStr];
    if (!config.features.compare || !compareState.active) {
      if (!compareState.active && compareMapUi.active) {
        compareMapUi.destroy();
      }
      clearLayers(map);
      let defs = getLayers(
        activeLayers,
        {
          reverse: true
        },
        state
      );
      lodashEach(defs, function(def) {
        if (isGraticule(def, proj.id)) {
          addGraticule(def.opacity, layerGroupStr);
        } else {
          map.addLayer(createLayer(def));
        }
      });
    } else {
      let stateArray = [['active', 'selected'], ['activeB', 'selectedB']];
      clearLayers(map);
      if (
        compareState &&
        !compareState.isCompareA &&
        compareState.mode === 'spy'
      ) {
        stateArray.reverse(); // Set Layer order based on active A|B group
      }
      lodashEach(stateArray, arr => {
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
  var getCompareLayerGroup = function(arr, layersState, projId, state) {
    return new OlLayerGroup({
      layers: getLayers(
        layersState[arr[0]],
        { reverse: true },
        store.getState()
      )
        .filter(def => {
          if (isGraticule(def, projId)) {
            addGraticule(def.opacity, arr[0]);
            return false;
          }
          return true;
        })
        .map(def => {
          return createLayer(def, {
            date: state.date[arr[1]],
            group: arr[0]
          });
        }),
      group: arr[0],
      date: arr[1]
    });
  };
  /*
   * Function called when layers need to be updated
   * e.g: can be the result of new data or another display
   *
   * @method updateLayerVisibilities
   * @static
   *
   * @returns {void}
   */
  var updateLayerVisibilities = function() {
    const state = store.getState();
    var renderable;
    var layers = self.selected.getLayers();
    var layersState = state.layers;
    var activeGroupStr = state.compare.activeString;
    var activeDateStr = state.compare.isCompareA ? 'selected' : 'selectedB';
    var updateGraticules = function(defs, groupName) {
      lodashEach(defs, function(def) {
        if (isGraticule(def, state.proj.id)) {
          renderable = isRenderableLayer(
            def.id,
            layersState[activeGroupStr],
            state.date[activeDateStr],
            state
          );
          if (renderable) {
            addGraticule(def.opacity, groupName);
          } else {
            removeGraticule(groupName);
          }
        }
      });
    };
    layers.forEach(function(layer) {
      var group = layer.get('group');
      // Not in A|B
      if (layer.wv) {
        renderable = isRenderableLayer(
          layer.wv.id,
          layersState[activeGroupStr],
          state.date[activeDateStr],
          state
        );
        layer.setVisible(renderable);
        let defs = getLayers(layersState[activeGroupStr], {}, state);
        updateGraticules(defs);
        // If in A|B layer-group will have a 'group' string
      } else if (group) {
        let defs;

        lodashEach(layer.getLayers().getArray(), subLayer => {
          if (subLayer.wv) {
            renderable = isRenderableLayer(
              subLayer.wv.id,
              layersState[group],
              state.date[layer.get('date')],
              state
            );
            subLayer.setVisible(renderable);
          }
        });
        layer.setVisible(true);
        defs = getLayers(layersState[group], {}, state);
        updateGraticules(defs, group);
      }
    });
  };
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
  var updateOpacity = function(action) {
    const state = store.getState();
    const { layers, compare, proj } = state;
    const activeStr = compare.isCompareA ? 'active' : 'activeB';
    const def = lodashFind(layers[activeStr], {
      id: action.id
    });

    if (isGraticule(def, proj.id)) {
      let strokeStyle = self['graticule-' + activeStr + '-style'];
      strokeStyle.setColor('rgba(255, 255, 255,' + action.opacity + ')');
      self.selected.render();
    } else {
      let layer = findLayer(def, activeStr);
      layer.setOpacity(action.opacity);
      updateLayerVisibilities();
    }
  };
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

  var addLayer = function(def, date, activeLayers) {
    const state = store.getState();
    const { compare, layers, proj } = state;
    const activeDateStr = compare.isCompareA ? 'selected' : 'selectedB';
    const activeLayerStr = compare.isCompareA ? 'active' : 'activeB';
    date = date || state.date[activeDateStr];
    activeLayers = activeLayers || layers[activeLayerStr];
    var reverseLayers = lodashCloneDeep(activeLayers).reverse();
    var mapIndex = lodashFindIndex(reverseLayers, {
      id: def.id
    });
    var mapLayers = self.selected.getLayers().getArray();
    var firstLayer = mapLayers[0];
    if (isGraticule(def, proj.id)) {
      addGraticule(def.opacity, activeLayerStr);
    } else {
      def.availableDates = util.datesinDateRanges(def, date, true);
      if (firstLayer && firstLayer.get('group')) {
        // Find which map layer-group is the active LayerGroup
        // and add layer to layerGroup in correct location
        let activelayer =
          firstLayer.get('group') === activeLayerStr
            ? firstLayer
            : mapLayers[1];
        let newLayer = createLayer(def, {
          date: date,
          group: activeLayerStr
        });
        activelayer.getLayers().insertAt(mapIndex, newLayer);
        compareMapUi.create(self.selected, compare.mode);
      } else {
        self.selected.getLayers().insertAt(mapIndex, createLayer(def));
      }
    }
    updateLayerVisibilities();

    self.events.trigger('added-layer');
  };
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
  var removeLayer = function(action) {
    const state = store.getState();
    const { compare, proj } = state;
    const activeLayerStr = compare.isCompareA ? 'active' : 'activeB';
    const def = action.def;

    if (isGraticule(def, proj.id)) {
      removeGraticule(activeLayerStr);
    } else {
      var layer = findLayer(def, activeLayerStr);
      if (compare && compare.active) {
        let layerGroup = getActiveLayerGroup(self.selected, activeLayerStr);
        if (layerGroup) layerGroup.getLayers().remove(layer);
      } else {
        self.selected.removeLayer(layer);
      }
    }
    updateLayerVisibilities();
  };

  /*
   * Update layers for the correct Date
   *
   * @method updateDate
   * @static
   *
   *
   * @returns {void}
   */
  var updateDate = self.updateDate = function() {
    const state = store.getState();
    const { compare } = state;
    const layerState = state.layers;
    const activeLayerStr = compare.activeString;
    const activeDate = compare.isCompareA ? 'selected' : 'selectedB';
    var activeLayers = getLayers(
      layerState[activeLayerStr],
      {},
      state
    ).reverse();
    var layerGroups;
    var layerGroup;
    if (compare && compare.active) {
      layerGroups = self.selected.getLayers().getArray();
      if (layerGroups.length === 2) {
        layerGroup =
          layerGroups[0].get('group') === activeLayerStr
            ? layerGroups[0]
            : layerGroups[1].get('group') === activeLayerStr
              ? layerGroups[1]
              : null;
      }
    }
    lodashEach(activeLayers, function(def) {
      if (!['subdaily', 'daily', 'monthly', 'yearly'].includes(def.period)) {
        return;
      }

      if (compare && compare.active) {
        if (layerGroup && layerGroup.getLayers().getArray().length) {
          let index = findLayerIndex(def, layerGroup);
          layerGroup.getLayers().setAt(
            index,
            createLayer(def, {
              group: activeLayerStr,
              date: state.date[activeDate]
            })
          );
          compareMapUi.update(activeLayerStr);
        }
      } else {
        let index = findLayerIndex(def);
        self.selected.getLayers().setAt(index, createLayer(def));
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
  var updateLookup = function(layerId) {
    reloadLayers();
  };

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
  var findLayer = function(def, layerGroupStr) {
    var layers = self.selected.getLayers().getArray();
    var layer = lodashFind(layers, {
      wv: {
        id: def.id
      }
    });

    if (!layer && layers.length && layers[0].get('group')) {
      let subGroup, olGroupLayer;
      lodashEach(layers, layerGroup => {
        if (layerGroup.get('group') === layerGroupStr) {
          olGroupLayer = layerGroup;
        }
      });
      subGroup = olGroupLayer.getLayers().getArray();
      layer = lodashFind(subGroup, {
        wv: {
          id: def.id
        }
      });
    }
    return layer;
  };

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
  var findLayerIndex = function(def, layerGroup) {
    layerGroup = layerGroup || self.selected;
    var layers = layerGroup.getLayers().getArray();

    var index = lodashFindIndex(layers, {
      wv: {
        id: def.id
      }
    });
    return index;
  };

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
  var isGraticule = function(def, proj) {
    return (
      def.projections[proj].type === 'graticule' || def.type === 'graticule'
    );
  };

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
  var addGraticule = function(opacity, groupStr) {
    groupStr = groupStr || 'active';
    opacity = opacity || 0.5;
    var graticule = self.selected['graticule-' + groupStr];
    if (graticule) {
      return;
    }
    var strokeStyle = new OlStyleStroke({
      color: 'rgba(255, 255, 255,' + opacity + ')',
      width: 2,
      lineDash: [0.5, 4],
      opacity: opacity
    });

    self.selected['graticule-' + groupStr] = new OlGraticule({
      map: self.selected,
      group: groupStr,
      strokeStyle: strokeStyle
    });
    self['graticule-' + groupStr + '-style'] = strokeStyle;
  };

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
  var removeGraticule = function(groupStr) {
    groupStr = groupStr || 'active';
    var graticule = self.selected['graticule-' + groupStr];
    if (graticule) {
      graticule.setMap(null);
    }
    self.selected['graticule-' + groupStr] = null;
  };

  var triggerExtent = lodashThrottle(
    function() {
      self.events.trigger('extent');
    },
    500,
    {
      trailing: true
    }
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
  var updateExtent = function() {
    const map = self.selected;
    const view = map.getView();
    const extent = view.calculateExtent(map.getSize());
    store.dispatch({ type: 'MAP/UPDATE_MAP_EXTENT', extent });
    triggerExtent();
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
  var createMap = function(proj, dateSelected) {
    const state = store.getState();
    const { date, compare } = state;
    const activeDate = compare.isCompareA ? 'selected' : 'selectedB';
    dateSelected = dateSelected || date[activeDate];
    var id,
      $map,
      scaleMetric,
      scaleImperial,
      rotateInteraction,
      map,
      mobileRotation;
    id = 'wv-map-' + proj.id;
    $map = $('<div></div>')
      .attr('id', id)
      .attr('data-proj', proj.id)
      .addClass('wv-map')
      .hide();
    $(selector).append($map);

    // Create two specific controls
    scaleMetric = new OlControlScaleLine({
      className: 'wv-map-scale-metric',
      units: 'metric'
    });
    scaleImperial = new OlControlScaleLine({
      className: 'wv-map-scale-imperial',
      units: 'imperial'
    });

    rotateInteraction = new OlInteractionDragRotate({
      condition: altKeyOnly,
      duration: animationDuration
    });
    mobileRotation = new OlInteractionPinchRotate({
      duration: animationDuration
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
        extent: proj.id === 'geographic' ? [-250, -90, 250, 90] : proj.maxExtent,
        constrainOnlyCenter: true
      }),
      target: id,
      renderer: ['canvas'],
      logo: false,
      controls: [scaleMetric, scaleImperial],
      interactions: [
        new OlInteractionDoubleClickZoom({
          duration: animationDuration
        }),
        new OlInteractionDragPan({
          kinetic: new OlKinetic(-0.005, 0.05, 100)
        }),
        new OlInteractionPinchZoom({
          duration: animationDuration
        }),
        new OlInteractionMouseWheelZoom({
          duration: animationDuration
        }),
        new OlInteractionDragZoom({
          duration: animationDuration
        })
      ],
      loadTilesWhileAnimating: true
    });
    map.wv = {
      small: false,
      scaleMetric: scaleMetric,
      scaleImperial: scaleImperial
    };
    createZoomButtons(map, proj);
    createMousePosSel(map, proj);

    // This component is inside the map viewport container. Allowing
    // mouse move events to bubble up displays map coordinates--let those
    // be blank when over a component.
    $('.wv-map-scale-metric').mousemove(e => e.stopPropagation());
    $('.wv-map-scale-imperial').mousemove(e => e.stopPropagation());

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
    map.on('pointerdrag', function() {
      self.mapIsbeingDragged = true;
      self.events.trigger('drag');
    });
    map.getView().on('propertychange', function(e) {
      switch (e.key) {
        case 'resolution':
          self.mapIsbeingZoomed = true;
          self.events.trigger('zooming');
          break;
      }
    });
    map.on('moveend', function(e) {
      self.events.trigger('moveend');
      setTimeout(function() {
        self.mapIsbeingDragged = false;
        self.mapIsbeingZoomed = false;
      }, 200);
    });
    const onRenderComplete = () => {
      store.dispatch({ type: 'MAP/UPDATE_MAP_UI', ui: self, rotation: self.selected.getView().getRotation() });
      map.un('rendercomplete', onRenderComplete);
      if (store.getState().data.active) ui.data.onActivate();
    };
    map.on('rendercomplete', onRenderComplete);
    map.on('click', function(e) {
      var metaTitle;
      var def;
      var metaArray = [];

      map.forEachFeatureAtPixel(e.pixel, function(feature, layer) {
        def = layer.wv.def;
        metaTitle = def.title;
        if (def.vectorData && def.vectorData.id) {
          let features = feature.getProperties();
          let vectorDataId = def.vectorData.id;
          let data = config.vectorData[vectorDataId];
          let obj = {
            'legend': data,
            'features': features
          };
          metaArray.push(obj);
        }
      });

      var uniqueMeta = metaArray
        .map(e => e['layer'])
        .map((e, i, final) => final.indexOf(e) === i && i)
        .filter(e => metaArray[e]).map(e => metaArray[e]);

      if (uniqueMeta.length) {
        let vectorPointMeta = uniqueMeta[0];
        let vectorDataId = def.vectorData.id;
        let legend = vectorPointMeta.legend;
        let features = vectorPointMeta.features;
        store.dispatch(openCustomContent('Vector' + vectorDataId,
          {
            headerText: metaTitle,
            backdrop: false,
            clickableBehindModal: true,
            desktopOnly: true,
            wrapClassName: 'clickable-behind-modal vector-modal-wrap',
            modalClassName: 'vector-modal',
            bodyComponent: VectorMetaTable,
            bodyComponentProps: {
              metaTitle: metaTitle,
              metaFeatures: features,
              metaLegend: legend
            },
            isDraggable: true
          }
        ));
      };
    });

    return map;
  };
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
  var createZoomButtons = function(map, proj) {
    var $map = $('#' + map.getTarget());

    var $zoomOut = $('<div></div>')
      .addClass('wv-map-zoom-out')
      .addClass('wv-map-zoom');
    var $outIcon = $('<i></i>')
      .addClass('fa')
      .addClass('fa-minus')
      .addClass('fa-1x');
    $zoomOut.append($outIcon);
    $map.append($zoomOut);
    $zoomOut.button({
      text: false
    });
    $zoomOut.click(() => {
      mapUtilZoomAction(map, -1);
    });
    $zoomOut.mousemove(e => e.stopPropagation());

    var $zoomIn = $('<div></div>')
      .addClass('wv-map-zoom-in')
      .addClass('wv-map-zoom');
    var $inIcon = $('<i></i>')
      .addClass('fa')
      .addClass('fa-plus')
      .addClass('fa-1x');
    $zoomIn.append($inIcon);
    $map.append($zoomIn);
    $zoomIn.button({
      text: false
    });
    $zoomIn.click(() => {
      mapUtilZoomAction(map, 1);
    });
    $zoomIn.mousemove(e => e.stopPropagation());

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
    var onZoomChange = function() {
      var maxZoom = proj.resolutions.length;
      var zoom = map.getView().getZoom();
      if (zoom === 0) {
        $zoomIn.button('enable');
        $zoomOut.button('disable');
      } else if (zoom === maxZoom) {
        $zoomIn.button('disable');
        $zoomOut.button('enable');
      } else {
        $zoomIn.button('enable');
        $zoomOut.button('enable');
      }
    };

    map.getView().on('change:resolution', function() {
      onZoomChange();
      self.events.trigger('movestart');
    });
    onZoomChange();
  };
  var onRotate = function(val) {
    rotation.updateRotation(val);
    updateExtent();
  };
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
  var createMousePosSel = function(map, proj) {
    var hoverThrottle;

    function onMouseMove(e) {
      var coords;
      var pixels;
      const state = store.getState();
      if (compareMapUi && compareMapUi.dragging) return;
      // if mobile return
      if (util.browser.small) {
        return;
      }
      // if over coords return
      if (
        $(e.relatedTarget).hasClass('map-coord') ||
        $(e.relatedTarget).hasClass('coord-btn')
      ) {
        return;
      }
      pixels = map.getEventPixel(e.originalEvent);
      coords = map.getCoordinateFromPixel(pixels);
      if (!coords) return;

      if (Math.abs(coords[0]) > 180) {
        if (coords[0] > 0) {
          coords[0] = coords[0] - 360;
        } else {
          coords[0] = coords[0] + 360;
        }
      }

      // setting a limit on running-data retrievel
      if (self.mapIsbeingDragged || util.browser.small) {
        return;
      }
      // Don't add data runners if we're on the events or data tabs, or if map is animating
      var isEventsTabActive =
        typeof state.events !== 'undefined' && state.events.active;
      var isDataTabActive =
        typeof state.data !== 'undefined' && state.data.active;
      var isMapAnimating = state.animation.isPlaying;
      if (isEventsTabActive || isDataTabActive || isMapAnimating) return;

      if (!self.mapIsbeingDragged && !self.mapIsbeingZoomed) dataRunner.newPoint(pixels, map);
    }
    $(map.getViewport())
      .mouseout(function(e) {
        if (
          $(e.relatedTarget).hasClass('map-coord') ||
          $(e.relatedTarget).hasClass('coord-btn')
        ) {
          return;
        }
        hoverThrottle.cancel();
        dataRunner.clearAll();
      })
      .mousemove((hoverThrottle = lodashThrottle(onMouseMove, 300)));
  };

  init();
  return self;
}
