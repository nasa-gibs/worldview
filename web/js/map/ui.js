import 'jquery-ui-bundle/jquery-ui';
import lodashFindIndex from 'lodash/findIndex';
import lodashEach from 'lodash/each';
import lodashForOwn from 'lodash/forOwn';
import lodashThrottle from 'lodash/throttle';
import lodashCloneDeep from 'lodash/cloneDeep';
import lodashFind from 'lodash/find';
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
import Cache from 'cachai';

export function mapui(models, config) {
  var layerBuilder, createLayer;
  var id = 'wv-map';
  var selector = '#' + id;
  var cache = new Cache(400); // Save layers from days visited
  var animationDuration = 250;
  var self = {};
  var rotation = new MapRotate(self, models);
  var dateline = mapDateLineBuilder(models, config);
  var precache = mapPrecacheTile(models, config, cache, self);
  var compare = mapCompare(models, config);

  var dataRunner = (self.runningdata = new MapRunningData(models, compare));

  self.mapIsbeingDragged = false;
  self.mapIsbeingZoomed = false;
  self.proj = {}; // One map for each projection
  self.selected = null; // The map for the selected projection
  self.events = util.events();
  layerBuilder = self.layerBuilder = mapLayerBuilder(
    models,
    config,
    cache,
    self
  );
  self.layerKey = layerBuilder.layerKey;
  createLayer = self.createLayer = layerBuilder.createLayer;
  self.promiseDay = precache.promiseDay;

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

    models.proj.events.on('select', function() {
      updateProjection();
    });
    models.layers.events
      .on('add', addLayer)
      .on('remove', removeLayer)
      .on('visibility', updateLayerVisibilities)
      .on('update', updateLayerOrder)
      .on('opacity', updateOpacity);
    if (models.compare) {
      models.compare.events
        .on('toggle', reloadLayers)
        .on('mode', reloadLayers)
        .on('toggle-state', () => {
          if (models.compare.mode === 'spy') {
            reloadLayers();
          }
        });
    }
    models.date.events.on('select', updateDate);
    models.palettes.events
      .on('set-custom', updateLookup)
      .on('clear-custom', updateLookup)
      .on('range', updateLookup)
      .on('update', updateLookup);
    $(window).on('resize', onResize);
    updateProjection(true);
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
    if (self.selected) {
      // Keep track of center point on projection switch
      self.selected.previousCenter = self.selected.center;
      hideMap(self.selected);
    }
    self.selected = self.proj[models.proj.selected.id];
    var map = self.selected;
    reloadLayers();

    // Update the rotation buttons if polar projection to display correct value
    if (
      models.proj.selected.id !== 'geographic' &&
      models.proj.selected.id !== 'webmerc'
    ) {
      let currentRotation = map.getView().getRotation();
      models.map.rotation = currentRotation;
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
      var projId = models.proj.selected.id;
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
  var reloadLayers = function(map) {
    map = map || self.selected;
    var compareModel = models.compare;
    var layerGroupStr = models.layers.activeLayers;
    var activeLayers = models.layers[layerGroupStr];

    if (!compareModel || !compareModel.active) {
      if (compare.active) {
        compare.destroy();
      }
      clearLayers(map);
      let defs = models.layers.get(
        {
          reverse: true
        },
        activeLayers
      );
      lodashEach(defs, function(def) {
        if (isGraticule(def)) {
          addGraticule(def.opacity, layerGroupStr);
        } else {
          map.addLayer(createLayer(def));
        }
      });
    } else {
      let stateArray = [['active', 'selected'], ['activeB', 'selectedB']];
      clearLayers(map);
      if (
        compareModel &&
        !compareModel.isCompareA &&
        compareModel.mode === 'spy'
      ) {
        stateArray.reverse(); // Set Layer order based on active A|B group
      }
      lodashEach(stateArray, arr => {
        map.addLayer(getCompareLayerGroup(arr));
      });
      compare.create(map, compareModel.mode);
    }
    updateLayerVisibilities();
  };
  /**
   * Create a Layergroup given the date and layerGroups
   * @param {Array} arr | Array of date/layer group strings
   */
  var getCompareLayerGroup = function(arr) {
    return new OlLayerGroup({
      layers: models.layers
        .get({ reverse: true }, models.layers[arr[0]])
        .filter(def => {
          if (isGraticule(def)) {
            addGraticule(def.opacity, arr[0]);
            return false;
          }
          return true;
        })
        .map(def => {
          return createLayer(def, {
            date: models.date[arr[1]],
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
    var renderable;
    var layers = self.selected.getLayers();
    var layersModel = models.layers;
    var layerGroupStr = models.layers.activeLayers;
    var updateGraticules = function(defs, groupName) {
      lodashEach(defs, function(def) {
        if (isGraticule(def)) {
          renderable = layersModel.isRenderable(
            def.id,
            layersModel[layerGroupStr]
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
        renderable = layersModel.isRenderable(layer.wv.id);
        layer.setVisible(renderable);
        let defs = layersModel.get({}, layersModel[layerGroupStr]);
        updateGraticules(defs);
        // If in A|B layer-group will have a 'group' string
      } else if (group) {
        let defs;

        lodashEach(layer.getLayers().getArray(), subLayer => {
          if (subLayer.wv) {
            renderable = layersModel.isRenderable(
              subLayer.wv.id,
              layersModel[group],
              models.date[layer.get('date')]
            );
            subLayer.setVisible(renderable);
          }
        });
        layer.setVisible(true);
        defs = layersModel.get({}, layersModel[group]);
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
  var updateOpacity = function(def, value, activeLayersString) {
    if (isGraticule(def)) {
      let strokeStyle = self['graticule-' + activeLayersString + '-style'];
      strokeStyle.setColor('rgba(255, 255, 255,' + value + ')');
      self.selected.render();
    } else {
      let layer = findLayer(def, activeLayersString);
      layer.setOpacity(value);
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
    date = date || models.date[models.date.activeDate];
    activeLayers = activeLayers || models.layers[models.layers.activeLayers];
    var reverseLayers = lodashCloneDeep(activeLayers).reverse();
    var mapIndex = lodashFindIndex(reverseLayers, {
      id: def.id
    });
    var layers = self.selected.getLayers().getArray();
    var firstLayer = layers[0];
    if (isGraticule(def)) {
      addGraticule(def.opacity, models.layers.activeLayers);
    } else {
      def.availableDates = util.datesinDateRanges(def, date, true);
      if (firstLayer && firstLayer.get('group')) {
        // Find which map layer-group is the active LayerGroup
        // and add layer to layerGroup in correct location
        let activelayer =
          firstLayer.get('group') === models.layers.activeLayers
            ? firstLayer
            : layers[1];
        let newLayer = createLayer(def, {
          date: date,
          group: models.layers.activeLayers
        });
        activelayer.getLayers().insertAt(mapIndex, newLayer);
        compare.create(self.selected, models.compare.mode);
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
  var removeLayer = function(def) {
    var activeLayerString = models.layers.activeLayers;
    if (isGraticule(def)) {
      removeGraticule(activeLayerString);
    } else {
      var layer = findLayer(def, activeLayerString);
      if (models.compare && models.compare.active) {
        let layerGroup = getActiveLayerGroup(self.selected, activeLayerString);
        layerGroup.getLayers().remove(layer);
      } else {
        self.selected.removeLayer(layer);
      }
    }
    updateLayerVisibilities();
  };

  /*
   * Reloads layer on change
   *
   * @method updateLayerOrder
   * @static
   *
   *
   * @returns {void}
   */
  var updateLayerOrder = function() {
    reloadLayers();
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
  var updateDate = function() {
    var layerModel = models.layers;
    var layers = layerModel
      .get({}, layerModel[layerModel.activeLayers])
      .reverse();
    let groupName = layerModel.activeLayers;
    var layerGroups;
    var layerGroup;
    if (models.compare && models.compare.active) {
      layerGroups = self.selected.getLayers().getArray();
      if (layerGroups.length === 2) {
        layerGroup =
          layerGroups[0].get('group') === groupName
            ? layerGroups[0]
            : layerGroups[1].get('group') === groupName
              ? layerGroups[1]
              : null;
      }
    }
    lodashEach(layers, function(def) {
      if (!['subdaily', 'daily', 'monthly', 'yearly'].includes(def.period)) {
        return;
      }

      if (models.compare && models.compare.active) {
        if (layerGroup) {
          let index = findLayerIndex(def, layerGroup);
          layerGroup.getLayers().setAt(
            index,
            createLayer(def, {
              group: groupName,
              date: models.date[models.date.activeDate]
            })
          );
          compare.update(groupName);
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

  self.getCustomLayerTimeout = function(layer) {
    if (models.palettes.isActive(layer.id)) {
      return 200;
    }
    return 0;
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
    if (!layer && layers[0].get('group')) {
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

    var layer = lodashFindIndex(layers, {
      wv: {
        id: def.id
      }
    });
    return layer;
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
  var isGraticule = function(def) {
    var proj = models.proj.selected.id;
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
    var map = self.selected;
    models.map.update(map.getView().calculateExtent(map.getSize()));
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
    dateSelected = dateSelected || models.date[models.date.activeDate];
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
        extent: proj.id === 'geographic' ? [-250, -90, 250, 90] : proj.maxExtent
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
    map.getView().on('change:center', updateExtent);
    map.getView().on('change:resolution', updateExtent);
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

    // Clicking on a vector shows it's attributes in console.
    map.on('click', function(e) {
      map.forEachFeatureAtPixel(e.pixel, function(feature, layer) {
        console.log(feature.getProperties());
      });
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
    $zoomOut.mousemove((e) => e.stopPropagation());

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
  var onRotate = function() {
    rotation.updateRotation();
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
      if (compare && compare.dragging) return;
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
        typeof models.naturalEvents !== 'undefined' &&
        models.naturalEvents.active;
      var isDataTabActive =
        typeof models.data !== 'undefined' && models.data.active;
      var isMapAnimating =
        typeof models.anim !== 'undefined' && models.anim.rangeState.playing;
      if (isEventsTabActive || isDataTabActive || isMapAnimating) return;

      dataRunner.newPoint(pixels, map);
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
