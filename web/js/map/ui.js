import $ from 'jquery';
import 'jquery-ui/button';
import lodashFindIndex from 'lodash/findIndex';
import lodashEach from 'lodash/each';
import lodashForOwn from 'lodash/forOwn';
import lodashThrottle from 'lodash/throttle';
import lodashFind from 'lodash/find';
import util from '../util/util';
import OlMap from 'ol/map';
import OlView from 'ol/view';
import OlKinetic from 'ol/kinetic';
import OlGraticule from 'ol/graticule';
import OlStyleStroke from 'ol/style/stroke';
import OlControlScaleLine from 'ol/control/scaleline';
import olEventsCondition from 'ol/events/condition';
import OlInteractionPinchRotate from 'ol/interaction/pinchrotate';
import OlInteractionDragRotate from 'ol/interaction/dragrotate';
import OlInteractionDoubleClickZoom from 'ol/interaction/doubleclickzoom';
import OlInteractionPinchZoom from 'ol/interaction/pinchzoom';
import OlInteractionDragPan from 'ol/interaction/dragpan';
import OlInteractionMouseWheelZoom from 'ol/interaction/mousewheelzoom';
import OlInteractionDragZoom from 'ol/interaction/dragzoom';
import olExtent from 'ol/extent';
import olProj from 'ol/proj';
import { MapRotate } from './rotation';
import { mapDateLineBuilder } from './datelinebuilder';
import { mapLayerBuilder } from './layerbuilder';
import { MapRunningData } from './runningdata';
import { mapPrecacheTile } from './precachetile';
import { mapUtilZoomAction } from './util';
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

  var dataRunner = self.runningdata = new MapRunningData(models);

  self.mapIsbeingDragged = false;
  self.mapIsbeingZoomed = false;
  self.proj = {}; // One map for each projection
  self.selected = null; // The map for the selected projection
  self.events = util.events();
  layerBuilder = self.layerBuilder = mapLayerBuilder(models, config, cache, self);
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
  var init = function () {
    if (config.parameters.mockMap) {
      return;
    }
    // NOTE: iOS sometimes bombs if this is _.each instead. In that case,
    // it is possible that config.projections somehow becomes array-like.
    lodashForOwn(config.projections, function (proj) {
      var map = createMap(proj);
      self.proj[proj.id] = map;
    });

    models.proj.events.on('select', function () {
      updateProjection();
    });
    models.layers.events
      .on('add', addLayer)
      .on('remove', removeLayer)
      .on('visibility', updateLayerVisibilities)
      .on('opacity', updateOpacity)
      .on('update', updateLayerOrder);
    models.date.events.on('select', updateDate);
    models.palettes.events
      .on('set-custom', updateLookup)
      .on('clear-custom', updateLookup)
      .on('range', updateLookup)
      .on('update', updateLookup);
    $(window)
      .on('resize', onResize);
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
  var updateProjection = function (start) {
    if (self.selected) {
      // Keep track of center point on projection switch
      self.selected.previousCenter = self.selected.center;
      hideMap(self.selected);
    }
    self.selected = self.proj[models.proj.selected.id];
    var map = self.selected;
    reloadLayers();

    // Update the rotation buttons if polar projection to display correct value
    if (models.proj.selected.id !== 'geographic' && models.proj.selected.id !== 'webmerc') {
      rotation.setResetButton(models.map.rotation);
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
        map.getView()
          .fit(extent, {
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
  var onResize = function () {
    var map = self.selected;
    if (map.small !== util.browser.small) {
      if (util.browser.small) {
        map.removeControl(map.wv.scaleImperial);
        map.removeControl(map.wv.scaleMetric);
        $('#' + map.getTarget() + ' .select-wrapper')
          .hide();
      } else {
        map.addControl(map.wv.scaleImperial);
        map.addControl(map.wv.scaleMetric);
        $('#' + map.getTarget() + ' .select-wrapper')
          .show();
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
  var hideMap = function (map) {
    $('#' + map.getTarget())
      .hide();
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
  var showMap = function (map) {
    $('#' + map.getTarget())
      .show();
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
  var clearLayers = function (map) {
    var activeLayers = map.getLayers()
      .getArray()
      .slice(0);
    lodashEach(activeLayers, function (mapLayer) {
      if (mapLayer.wv) {
        map.removeLayer(mapLayer);
      }
    });
    removeGraticule();
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
  var reloadLayers = function (map) {
    map = map || self.selected;
    clearLayers(map);

    var defs = models.layers.get({
      reverse: true
    });
    lodashEach(defs, function (def) {
      if (isGraticule(def)) {
        addGraticule();
      } else {
        self.selected.addLayer(createLayer(def));
      }
    });
    updateLayerVisibilities();
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
  var updateLayerVisibilities = function () {
    var layers = self.selected.getLayers();
    layers.forEach(function (layer) {
      if (layer.wv) {
        var renderable = models.layers.isRenderable(layer.wv.id);
        layer.setVisible(renderable);
      }
    });
    var defs = models.layers.get();
    lodashEach(defs, function (def) {
      if (isGraticule(def)) {
        var renderable = models.layers.isRenderable(def.id);
        if (renderable) {
          addGraticule();
        } else {
          removeGraticule();
        }
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
  var updateOpacity = function (def, value) {
    var layer = findLayer(def);
    layer.setOpacity(value);
    updateLayerVisibilities();
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

  var addLayer = function (def) {
    var date = models.date.selected;
    var mapIndex = lodashFindIndex(models.layers.get({
      reverse: true
    }), {
      id: def.id
    });
    if (isGraticule(def)) {
      addGraticule();
    } else {
      def.availableDates = util.datesinDateRanges(def, date, true);
      self.selected.getLayers()
        .insertAt(mapIndex, createLayer(def));
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
  var removeLayer = function (def) {
    if (isGraticule(def)) {
      removeGraticule();
    } else {
      var layer = findLayer(def);
      self.selected.removeLayer(layer);
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
  var updateLayerOrder = function () {
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
  var updateDate = function () {
    var defs = models.layers.get();
    lodashEach(defs, function (def) {
      if (!['subdaily', 'daily', 'monthly', 'yearly'].includes(def.period)) {
        return;
      }
      var index = findLayerIndex(def);

      self.selected.getLayers()
        .setAt(index, createLayer(def));
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
  var updateLookup = function (layerId) {
    reloadLayers();
  };

  self.getCustomLayerTimeout = function (layer) {
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
  var findLayer = function (def) {
    var layers = self.selected.getLayers()
      .getArray();
    var layer = lodashFind(layers, {
      wv: {
        id: def.id
      }
    });
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
  var findLayerIndex = function (def) {
    var layers = self.selected.getLayers()
      .getArray();
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
  var isGraticule = function (def) {
    var proj = models.proj.selected.id;
    return (def.projections[proj].type === 'graticule' ||
      def.type === 'graticule');
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
  var addGraticule = function () {
    if (self.selected.graticule) { return; }

    self.selected.graticule = new OlGraticule({
      map: self.selected,
      strokeStyle: new OlStyleStroke({
        color: 'rgba(255, 255, 255, 0.5)',
        width: 2,
        lineDash: [0.5, 4]
      })
    });
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
  var removeGraticule = function () {
    if (self.selected.graticule) { self.selected.graticule.setMap(null); }

    self.selected.graticule = null;
  };

  var triggerExtent = lodashThrottle(function () {
    self.events.trigger('extent');
  }, 500, {
    trailing: true
  });

  /*
   * Updates the extents of OpenLayers map
   *
   *
   * @method updateExtent
   * @static
   *
   * @returns {void}
   */
  var updateExtent = function () {
    var map = self.selected;
    models.map.update(map.getView()
      .calculateExtent(map.getSize()));
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
  var createMap = function (proj) {
    var id, $map, scaleMetric, scaleImperial, rotateInteraction,
      map, mobileRotation;

    id = 'wv-map-' + proj.id;
    $map = $('<div></div>')
      .attr('id', id)
      .attr('data-proj', proj.id)
      .addClass('wv-map')
      .hide();
    $(selector)
      .append($map);

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
      condition: olEventsCondition.altKeyOnly,
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
        rotation: (proj.id === 'geographic' || proj.id === 'webmerc') ? 0.0 : models.map.rotation,
        zoom: proj.startZoom,
        maxZoom: proj.numZoomLevels,
        enableRotation: true,
        extent: proj.id === 'geographic' ? [-250, -90, 250, 90] : proj.maxExtent
      }),
      target: id,
      renderer: ['canvas'],
      logo: false,
      controls: [
        scaleMetric,
        scaleImperial
      ],
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

    // allow rotation by dragging for polar projections
    if (proj.id !== 'geographic' && proj.id !== 'webmerc') {
      rotation.init(map, proj.id);
      map.addInteraction(rotateInteraction);
      map.addInteraction(mobileRotation);
    } else if (proj.id === 'geographic') {
      dateline.init(self, map, models.date.selected);
    }

    // Set event listeners for changes on the map view (when rotated, zoomed, panned)
    map.getView()
      .on('change:center', updateExtent);
    map.getView()
      .on('change:resolution', updateExtent);
    map.getView()
      .on('change:rotation', lodashThrottle(onRotate, 300));
    map.on('pointerdrag', function () {
      self.mapIsbeingDragged = true;
      self.events.trigger('drag');
    });
    map.getView()
      .on('propertychange', function (e) {
        switch (e.key) {
          case 'resolution':
            self.mapIsbeingZoomed = true;
            break;
        }
      });
    map.on('moveend', function (e) {
      self.events.trigger('moveend');
      setTimeout(function () {
        self.mapIsbeingDragged = false;
        self.mapIsbeingZoomed = false;
      }, 200);
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
  var createZoomButtons = function (map, proj) {
    var $map = $('#' + map.getTarget());

    var $zoomOut = $('<button></button>')
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

    var $zoomIn = $('<button></button>')
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
    var onZoomChange = function () {
      var maxZoom = proj.resolutions.length;
      var zoom = map.getView()
        .getZoom();
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

    map.getView()
      .on('change:resolution', function () {
        onZoomChange();
        self.events.trigger('movestart');
      });
    onZoomChange();
  };
  var onRotate = function () {
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
  var createMousePosSel = function (map, proj) {
    var $map;
    var mapId;
    var $mousePosition;
    var $latlonDD;
    var $latlonDMS;
    var $coordBtn;
    var $coordWrapper;
    var coordinateFormat;
    var hoverThrottle;
    var extent;

    // var timer = null;
    // var isIntervalSet = false;

    $map = $('#' + map.getTarget());
    map = map || self.selected;
    mapId = 'coords-' + proj.id;
    extent = proj.maxExtent;

    $mousePosition = $('<div></div>')
      .attr('id', mapId)
      .addClass('wv-coords-map wv-coords-map-btn');

    /*
     * Creates map events based on mouse position
     *
     * @function coordinateFormat
     * @static
     *
     * @param {Array} source - Coordinates
     * @param {String} format - units of coordinates
     *
     * @returns {void}
     */
    coordinateFormat = function (source, format, outsideExtent) {
      var target, crs;
      crs = models.proj.selected.crs;
      if (outsideExtent) {
        return crs;
      }
      target = olProj.transform(source, proj.crs, 'EPSG:4326');
      return util.formatCoordinate(target, format) + ' ' + crs;
    };

    $map.append($mousePosition);

    $latlonDD = $('<span></span>')
      .attr('id', mapId + '-latlon-dd')
      .attr('data-format', 'latlon-dd')
      .addClass('map-coord');
    $latlonDMS = $('<span></span>')
      .attr('id', mapId + '-latlon-dms')
      .attr('data-format', 'latlon-dms')
      .addClass('map-coord');

    if (util.getCoordinateFormat() === 'latlon-dd') {
      $('div.map-coord')
        .removeClass('latlon-selected');
      $latlonDD.addClass('latlon-selected');
    } else {
      $('div.map-coord')
        .removeClass('latlon-selected');
      $latlonDMS.addClass('latlon-selected');
    }
    $coordBtn = $('<i></i>')
      .addClass('coord-switch');

    $coordWrapper = $('<div></div>')
      .addClass('coord-btn');

    $coordWrapper.append($coordBtn);

    $mousePosition
      .append($latlonDD)
      .append($latlonDMS)
      .append($coordWrapper)
      .click(function () {
        var $format = $(this)
          .find('.latlon-selected');

        if ($format.attr('data-format') === 'latlon-dd') {
          $('span.map-coord')
            .removeClass('latlon-selected');
          $('span.map-coord[data-format="latlon-dms"]')
            .addClass('latlon-selected');
          util.setCoordinateFormat('latlon-dms');
        } else {
          $('span.map-coord')
            .removeClass('latlon-selected');
          $('span.map-coord[data-format="latlon-dd"]')
            .addClass('latlon-selected');
          util.setCoordinateFormat('latlon-dd');
        }
      });

    function onMouseMove (e) {
      var coords;
      var pixels;
      var outside;

      // if mobile return
      if (util.browser.small) {
        return;
      }
      // if over coords return
      if ($(e.relatedTarget)
        .hasClass('map-coord') ||
        $(e.relatedTarget)
          .hasClass('coord-btn')) {
        return;
      }
      pixels = map.getEventPixel(e.originalEvent);
      coords = map.getCoordinateFromPixel(pixels);
      if (!coords) return;
      if (!olExtent.containsCoordinate(extent, coords)) {
        outside = true;
      }

      if (Math.abs(coords[0]) > 180) {
        if (coords[0] > 0) {
          coords[0] = coords[0] - 360;
        } else {
          coords[0] = coords[0] + 360;
        }
      }

      $('#' + mapId)
        .show();
      $('#' + mapId + ' span.map-coord')
        .each(function () {
          var format = $(this)
            .attr('data-format');
          $(this)
            .html(coordinateFormat(coords, format, outside));
        });

      // setting a limit on running-data retrievel
      if (self.mapIsbeingDragged || util.browser.small) {
        return;
      }
      // Don't add data runners if we're on the events or data tabs, or if map is animating
      var isEventsTabActive = (typeof models.naturalEvents !== 'undefined' && models.naturalEvents.active);
      var isDataTabActive = (typeof models.data !== 'undefined' && models.data.active);
      var isMapAnimating = (typeof models.anim !== 'undefined' && models.anim.rangeState.playing);
      if (isEventsTabActive || isDataTabActive || isMapAnimating) return;

      dataRunner.newPoint(pixels, map);
    }
    $(map.getViewport())
      .mouseover(function (e) {
        if ($(e.relatedTarget)
          .hasClass('map-coord') ||
          $(e.relatedTarget)
            .hasClass('coord-btn')) {
          return;
        }
        $('#' + mapId)
          .show();
      })
      .mouseout(function (e) {
        if ($(e.relatedTarget)
          .hasClass('map-coord') ||
          $(e.relatedTarget)
            .hasClass('coord-btn')) {
          return;
        }
        $('#' + mapId)
          .hide();
        hoverThrottle.cancel();
        dataRunner.clearAll();
      })
      .mousemove(hoverThrottle = lodashThrottle(onMouseMove, 300));
  };

  init();
  return self;
};
