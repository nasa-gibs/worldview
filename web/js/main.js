// External Dependencies
import $ from 'jquery';
import loEach from 'lodash/each';
// import {GA as googleAnalytics} from 'worldview-components';

// Utils
import util from './util/util'; // Maybe this is the time to remove the util file from core and put everything from there in the worldview-components util....
// Date
import {parse as dateParser} from './date/date'; // export default function parse!!!
import DateModel from './date/model';
import DateLabel from './date/label';
import DateWheels from './date/wheels';
// Timeline
import Timeline from './date/timeline';
import TimelineData from './date/timeline-data';
import TimelineConfig from './date/config';
import TimelineZoom from './date/timeline-zoom';
import TimelineTicks from './date/timeline-ticks';
import TimelinePick from './date/timeline-pick';
import TimelinePan from './date/timeline-pan';
import TimelineInput from './date/timeline-input';
// Layers
import {parse as layerParser, validate as layerValidate} from './layers/layers'; // export parse as layerParser. etc...
import layersModel from './layers/model';
import layersModal from './layers/modal';
import layersSidebar from './layers/sidebar';
import layersActive from './layers/active';
// Map
import {parse as mapParser} from './map/map';
import MapModel from './map/model';
import MapUI from './map/ui';
import MapRotate from './map/rotation';
import MapRunningData from './map/runningdata';
import MapLayerBuilder from './map/layerbuilder';
import MapDatelineBuilder from './map/datelinebuilder';
import MapPrecacheTile from './map/precachetile';
import MapAnimate from './map/animate';
// Animation
// import {animationParser} from './animation/anim';
// import AnimationModel from './animation/model';
// import AnimationUI from './animation/ui';
// import AnimationWidget from './animation/animation-widget';
// import AnimationRangeselect from './animation/rangeselect';
// import AnimationGIF from './animation/anim.gif';
// Palettes
import palettes from './palettes/palettes';
import palettesModel from './palettes/model';
// Data
// import dataParser from './data/data';
// import DataModel from './data/model';
// import DataUI from './data/ui';
// NaturalEvents
// import NaturalEventsModel from './naturalEvents/model';
// import NaturalEventsUI from './naturalEvents/ui';
// import NaturalEventsRequest from './naturalEvents/request';
// Image
import imageRubberband from './image/rubberband';
import imagePanel from './image/panel';
// Notifications
// import NotificationsUI from './notifications/notifications.ui';
// UI
import loadingIndicator from './ui/indicator'; // not a class, export object
// Link
import linkModel from './link/model';
import linkUi from './link/ui';
// Projections
import {parse as projectionParser} from './projection/projection';
import {projectionModel} from './projection/model';
import {projectionUi} from './projection/ui';
import {projectionChange} from './projection/change';
// Other
//  import {debugConfig, debug} from './debug';
import Brand from './brand';
// import Tour from './tour';

import {polyfill} from './polyfill';
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

    // Export for debugging
    wvx.config = config;

    // debugConfig(config);

    // Load any additional scripts as needed
    if (config.scripts) {
      loEach(config.scripts, function(script) {
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
      //parsers.push(dataParser);
    }
    if (config.features.animation) {
      //parsers.push(animationParser);
    }
    loEach(parsers, function(parser) {
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
    // Export for debugging
    wvx.models = models;
    wvx.ui = ui;

    models.proj = projectionModel(config);
    models.palettes = palettesModel(models, config);
    models.layers = layersModel(models, config);
    models.date = DateModel(config, {
      initial: initialDate
    });
    models.map = MapModel(models, config);
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
      Rotation: MapRotate,
      Runningdata: MapRunningData,
      Layerbuilder: MapLayerBuilder,
      Dateline: MapDatelineBuilder,
      Precache: MapPrecacheTile
    };
    ui.map = MapUI(models, config, mapComponents);
    ui.map.animate = MapAnimate(models, config, ui);
    if (config.features.animation) {
      models.anim = AnimationModel(models, config);
      models.link.register(models.anim);
    }
    if (config.features.dataDownload) {
      models.data = DataModel(models, config);
      models.link.register(models.data);
    }
    if (config.features.naturalEvents) {
      models.naturalEvents = NaturalEventsModel(models, config, ui);
      models.link.register(models.naturalEvents);
    }
    // HACK: Map needs permalink state loaded before starting. But
    // data download now needs it too.
    models.link.load(state); // needs to be loaded twice

    if (config.features.arcticProjectionChange) {
      models.proj.change = projectionChange(models, config);
    }

    elapsed('ui');
    // Create widgets
    ui.proj = projectionUi(models, config);
    ui.sidebar = layersSidebar(models, config);
    ui.activeLayers = layersActive(models, ui, config);
    ui.addModal = layersModal(models, ui, config);

    function timelineInit() {
      ui.timeline = Timeline(models, config, ui);
      ui.timeline.data = TimelineData(models, config, ui);
      ui.timeline.zoom = TimelineZoom(models, config, ui);
      ui.timeline.ticks = TimelineTicks(models, config, ui);
      ui.timeline.pick = TimelinePick(models, config, ui);
      ui.timeline.pan = TimelinePan(models, config, ui);
      ui.timeline.config = TimelineConfig(models, config, ui);
      ui.timeline.input = TimelineInput(models, config, ui);
      if (config.features.animation) {
        ui.anim = {};
        ui.anim.rangeselect = AnimationRangeselect(models, config, ui); // SETS STATE: NEEDS TO LOAD BEFORE ANIMATION WIDGET
        ui.anim.widget = AnimationWidget(models, config, ui);
        ui.anim.gif = AnimationGIF(models, config, ui);
        ui.anim.ui = AnimationUI(models, ui);
      }

      ui.dateLabel = DateLabel(models);
    }
    if (config.startDate) {
      if (!util.browser.small) { // If mobile device, do not build timeline
        timelineInit();
      }
      ui.dateWheels = DateWheels(models, config);
    }

    ui.rubberband = imageRubberband(models, ui, config);
    ui.image = imagePanel(models, ui, config);
    if (config.features.dataDownload) {
      ui.data = DataUI(models, ui, config);
      // FIXME: Why is this here?
      ui.data.render();
    }
    if (config.features.naturalEvents) {
      ui.naturalEvents = NaturalEventsUI(models, ui, config, NaturalEventsRequest(models, ui, config));
    }
    ui.link = linkUi(models, config);
    ui.tour = Tour(models, ui, config);
    ui.info = LinkInfo(ui, config);
    if (config.features.alert) {
      ui.alert = NotificationsUI(ui, config);
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
    // debug.layers(ui, models, config);

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

    loEach(errors, function(error) {
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
