import 'babel-polyfill'; // Needed for worldview-components in IE and older browsers
import $ from 'jquery';
import lodashEach from 'lodash/each';
import { GA as googleAnalytics } from 'worldview-components';

// Utils
import util from './util/util';

// Date
import { parse as dateParser } from './date/date';
import { dateModel } from './date/model';
import { dateLabel } from './date/label';
import dateWheels from './date/wheels';

// Timeline
import { timeline } from './date/timeline';
import { timelineData } from './date/timeline-data';
import { timelineConfig } from './date/config';
import { timelineZoom } from './date/timeline-zoom';
import { timelineTicks } from './date/timeline-ticks';
import { timelinePick } from './date/timeline-pick';
import { timelinePan } from './date/timeline-pan';
import { timelineInput } from './date/timeline-input';

// Layers
import { parse as layerParser, validate as layerValidate } from './layers/layers';
import { layersModel } from './layers/model';
import { layersModal } from './layers/modal';
import { layersSidebar } from './layers/sidebar';
import { layersActive } from './layers/active';

// Map
import { mapParser } from './map/map';
import { mapModel } from './map/model';
import { mapui } from './map/ui';
import { mapRotate } from './map/rotation';
import { MapRunningData } from './map/runningdata';
import { mapLayerBuilder } from './map/layerbuilder';
import { mapDatelineBuilder } from './map/datelinebuilder';
import { mapPrecacheTile } from './map/precachetile';
import { mapAnimate } from './map/animate';

// Animation
import { parse as animationParser } from './animation/anim';
import { animationModel } from './animation/model';
import { animationUi } from './animation/ui';
import { animationWidget } from './animation/widget';
import { animationRangeSelect } from './animation/range-select';
import { animationGif } from './animation/gif';

// Palettes
import palettes from './palettes/palettes';
import { palettesModel } from './palettes/model';

// Data
import { dataParser } from './data/data';
import { dataModel } from './data/model';
import { dataUi } from './data/ui';

// NaturalEvents
import naturalEventsModel from './natural-events/model';
import naturalEventsUI from './natural-events/ui';
import naturalEventsRequest from './natural-events/request';

// Image
import { imageRubberband } from './image/rubberband';
import { imagePanel } from './image/panel';

// Notifications
import { notificationsUi } from './notifications/ui';

// UI
import loadingIndicator from './ui/indicator';

// Link
import { linkModel } from './link/model';
import { linkUi } from './link/ui';

// Projections
import { parse as projectionParser } from './projection/projection';
import { projectionModel } from './projection/model';
import { projectionUi } from './projection/ui';

// Other
import { debugConfig, debugLayers } from './debug';
import Brand from './brand';
import tour from './tour';
import { uiInfo } from './ui/info';

import { polyfill } from './polyfill';
polyfill(); // Polyfills some browser features

// Document ready function
window.onload = () => {
  var errors = [];
  var requirements;
  var startTime;
  var wvx = {};
  var config;
  var parsers;
  var state = util.fromQueryString(location.search);
  var parameters = util.fromQueryString(location.search);

  var main = function() {
    if (parameters.elapsed) {
      startTime = new Date()
        .getTime();
    } else {
      elapsed = function() {};
    }
    elapsed('start');
    loadConfig();
  };

  var loadConfig = function() {
    elapsed('loading config');
    var configURI = Brand.url('config/wv.json');
    var promise = $.getJSON(configURI);
    promise
      .done(util.wrap(onConfigLoaded))
      .fail(util.error);
    loadingIndicator.delayed(promise, 1000);
  };

  var onConfigLoaded = function(data) {
    elapsed('config loaded');
    config = data;
    config.parameters = parameters;

    // Attach to wvx object for debugging
    wvx.config = config;

    debugConfig(config);

    // Load any additional scripts as needed
    if (config.scripts) {
      lodashEach(config.scripts, function(script) {
        $.getScript(script);
      });
    }

    layerValidate(errors, config);

    parsers = [
      projectionParser,
      layerParser,
      dateParser,
      mapParser,
      palettes.parse
    ];
    if (config.features.dataDownload) {
      parsers.push(dataParser);
    }
    if (config.features.animation) {
      parsers.push(animationParser);
    }
    lodashEach(parsers, function(parser) {
      parser(state, errors, config);
    });
    requirements = [
      palettes.requirements(state, config)
    ];

    $.when.apply(null, requirements)
      .then(util.wrap(init))
      .fail(util.error);
  };

  var init = function() {
    elapsed('init');
    // If at the beginning of the day, wait on the previous day until GIBS
    // catches up (about three hours)
    var initialDate;
    if (config.defaults.startDate) {
      initialDate = util.parseDateUTC(config.defaults.startDate);
    } else {
      initialDate = util.now();
      if (initialDate.getUTCHours() < 3) {
        initialDate.setUTCDate(initialDate.getUTCDate() - 1);
      }
    }

    // Models
    var models = {
      wv: {
        events: util.events()
      }
    };
    var ui = {};
    // Attach to wvx object for debugging
    wvx.models = models;
    wvx.ui = ui;

    models.proj = projectionModel(config);
    models.palettes = palettesModel(models, config);
    models.layers = layersModel(models, config);
    models.date = dateModel(models, config, {
      initial: initialDate
    });
    models.map = mapModel(models, config);
    models.link = linkModel(config);

    models.link
      .register(models.proj)
      .register(models.layers)
      .register(models.date)
      .register(models.palettes)
      .register(models.map);
    models.link.load(state);
    if (config.features.googleAnalytics) {
      googleAnalytics.init(config.features.googleAnalytics.id); // Insert google tracking
    }
    // HACK: Map needs to be created before the data download model
    var mapComponents = {
      Rotation: mapRotate,
      Runningdata: MapRunningData,
      Layerbuilder: mapLayerBuilder,
      Dateline: mapDatelineBuilder,
      Precache: mapPrecacheTile
    };
    ui.map = mapui(models, config, mapComponents);
    ui.map.animate = mapAnimate(models, config, ui);
    if (config.features.animation) {
      models.anim = animationModel(models, config);
      models.link.register(models.anim);
    }
    if (config.features.dataDownload) {
      models.data = dataModel(models, config);
      models.link.register(models.data);
    }
    if (config.features.naturalEvents) {
      models.naturalEvents = naturalEventsModel(models, config, ui);
      models.link.register(models.naturalEvents);
    }
    // HACK: Map needs permalink state loaded before starting. But
    // data download now needs it too.
    models.link.load(state); // needs to be loaded twice

    elapsed('ui');
    // Create widgets
    ui.proj = projectionUi(models, config);
    ui.sidebar = layersSidebar(models, config);
    ui.activeLayers = layersActive(models, ui, config);
    ui.addModal = layersModal(models, ui, config);

    // Test via a getter in the options object to see if the passive property is accessed
    ui.supportsPassive = false;
    try {
      var opts = Object.defineProperty({}, 'passive', {
        get: function() {
          ui.supportsPassive = true;
        }
      });
      window.addEventListener('testPassive', null, opts);
      window.removeEventListener('testPassive', null, opts);
    } catch (e) {}

    function timelineInit() {
      ui.timeline = timeline(models, config, ui);
      ui.timeline.data = timelineData(models, config, ui);
      ui.timeline.zoom = timelineZoom(models, config, ui);
      ui.timeline.ticks = timelineTicks(models, config, ui);
      ui.timeline.pick = timelinePick(models, config, ui);
      ui.timeline.pan = timelinePan(models, config, ui);
      ui.timeline.config = timelineConfig(models, config, ui);
      ui.timeline.input = timelineInput(models, config, ui);
      if (config.features.animation) {
        ui.anim = {};
        ui.anim.rangeselect = animationRangeSelect(models, config, ui); // SETS STATE: NEEDS TO LOAD BEFORE ANIMATION WIDGET
        ui.anim.widget = animationWidget(models, config, ui);
        ui.anim.gif = animationGif(models, config, ui);
        ui.anim.ui = animationUi(models, ui);
      }

      ui.dateLabel = dateLabel(models);
    }
    if (config.startDate) {
      if (!util.browser.small) { // If mobile device, do not build timeline
        timelineInit();
      }
      ui.dateWheels = dateWheels(models, config);
    }

    ui.rubberband = imageRubberband(models, ui, config);
    ui.image = imagePanel(models, ui, config);
    if (config.features.dataDownload) {
      ui.data = dataUi(models, ui, config);
      // FIXME: Why is this here?
      ui.data.render();
    }
    if (config.features.naturalEvents) {
      var request = naturalEventsRequest(models, ui, config);
      ui.naturalEvents = naturalEventsUI(models, ui, config, request);
    }
    ui.link = linkUi(models, config);
    ui.tour = tour(models, ui, config);
    ui.info = uiInfo(ui, config);
    if (config.features.alert) {
      ui.alert = notificationsUi(ui, config);
    }

    // FIXME: Old hack
    $(window)
      .resize(function() {
        if (util.browser.small) {
          $('#productsHoldertabs li.first a')
            .trigger('click');
        }
        if (!ui.timeline) {
          timelineInit();
        }
      });

    document.activeElement.blur();
    $('input')
      .blur();
    $('#eventsHolder')
      .hide();

    if (config.features.dataDownload) {
      models.data.events
        .on('activate', function() {
          ui.sidebar.selectTab('download');
        })
        .on('queryResults', function() {
          ui.data.onViewChange();
        });
      ui.map.events.on('extent', function() {
        ui.data.onViewChange();
      });
      // FIXME: This is a hack
      models.map.events.on('projection', models.data.updateProjection);
    }
    // Sink all focus on inputs if click unhandled
    $(document)
      .click(function(event) {
        if (event.target.nodeName !== 'INPUT') {
          $('input')
            .blur();
        }
      });

    // Console notifications
    if (Brand.release()) {
      console.info(Brand.NAME + ' - Version ' + Brand.VERSION +
        ' - ' + Brand.BUILD_TIMESTAMP);
    } else {
      console.warn('Development version');
    }
    debugLayers(ui, models, config);

    errorReport();

    models.wv.events.trigger('startup');
    elapsed('done');

    // Reset Worldview when clicking on logo
    $(document).click(function(e) {
      if (e.target.id === 'wv-logo') resetWorldview(e);
    });
  };

  var resetWorldview = function(e) {
    e.preventDefault();
    if (window.location.search === '') return; // Nothing to reset
    var msg = 'Do you want to reset Worldview to its defaults? You will lose your current state.';
    if (confirm(msg)) document.location.href = '/';
  };

  var errorReport = function() {
    var layersRemoved = 0;

    lodashEach(errors, function(error) {
      var cause = (error.cause) ? ': ' + error.cause : '';
      util.warn(error.message + cause);
      if (error.layerRemoved) {
        layersRemoved = layersRemoved + 1;
      }
    });
  };

  var elapsed = function(message) {
    if (!parameters.elapsed) return;
    var t = new Date()
      .getTime() - startTime;
    console.log(t, message);
  };
  util.wrap(main)();
};
