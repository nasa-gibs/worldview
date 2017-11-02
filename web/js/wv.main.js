// External Dependencies
import $ from 'jquery';
import { each } from 'lodash';
import {GA as googleAnalytics} from 'worldview-components';

// Utils
import util from './util/util'; // Maybe this is the time to remove the util file from core and put everything from there in the worldview-components util....
import browser from './util/util.browser';
// Date
import {dateParser} from './date/date'; // export default function parse!!!
import DateModel from './date/date.model';
import DateLabel from './date/date.label';
import DateWheels from './date/date.wheels';
// Timeline
import Timeline from './date/date.timeline';
import TimelineData from './date/date.timeline.data';
import TimelineConfig from './date/date.timeline.config';
import TimelineZoom from './date/date.timeline.zoom';
import TimelineTicks from './date/date.timeline.ticks';
import TimelinePick from './date/date.timeline.pick';
import TimelinePan from './date/date.timeline.pan';
import TimelineInput from './date/date.timeline.input';
// Layers
import {layerParser, layerValidate} from './layers/layers'; // export parse as layerParser. etc...
import LayersModel from './layers/layers.model';
import LayersModal from './layers/layers.modal';
import LayersSidebar from './layers/layers.sidebar';
import LayersActive from './layers/layers.active';
// Map
import {mapParser} from './map/map';
import MapModel from './map/map.model';
import MapUI from './map/map.ui';
import MapRotate from './map/map.rotate';
import MapRunningData from './map/map.runningdata';
import MapLayerBuilder from './map/map.layerbuilder';
import MapDatelineBuilder from './map/map.datelinebuilder';
import MapPrecacheTile from './map/map.precachetile';
import MapAnimate from './map/map.animate';
// Animation
import {animationParser} from './animation/anim';
import AnimationModel from './animation/anim.model';
import AnimationUI from './animation/anim.ui';
import AnimationWidget from './animation/animation-widget';
import AnimationRangeselect from './animation/anim.rangeselect';
import AnimationGIF from './animation/anim.gif';
// Palettes
import {palettesParser, paletteRequirements} from './palettes/palettes';
import PalettesModel from './palettes/palettes.model';
// Data
import dataParser from './data/data';
import DataModel from './data/data.model';
import DataUI from './data/data.ui';
// NaturalEvents
import NaturalEventsModel from './naturalEvents/naturalEvents.model';
import NaturalEventsUI from './naturalEvents/naturalEvents.ui';
import NaturalEventsRequest from './naturalEvents/naturalEvents.request';
// Image
import ImageRubberband from './image/image.rubberband';
import ImagePanel from './image/image.panel';
// Notifications
import NotificationsUI from './notifications/notifications.ui';
// UI
import {loadingIndicator} from './ui/ui.indicator'; // not a class, export object
// Link
import linkModel from './link/link.model';
import linkUI from './link/link.ui';
// Projections
import projectionParser from './proj/proj';
import ProjectionModel from './proj/proj.model';
import ProjectionUI from './proj/proj.ui';
import ProjectionChange from './proj/proj.change';
// Other
import {debugConfig, debug} from './debug';
import Brand from './brand';
import Tour from './tour';

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
    loadingIndicator(promise, 1000);
  };

  var onConfigLoaded = function(data) {
    elapsed('config loaded');
    config = data;
    config.parameters = parameters;

    // Export for debugging
    wvx.config = config;

    debugConfig(config);

    // Load any additional scripts as needed
    if (config.scripts) {
      each(config.scripts, function(script) {
        $.getScript(script);
      });
    }

    layerValidate(errors, config);

    parsers = [
      projectionParser,
      layerParser,
      dateParser,
      mapParser,
      palettesParser
    ];
    if (config.features.dataDownload) {
      parsers.push(dataParser);
    }
    if (config.features.animation) {
      parsers.push(animationParser);
    }
    each(parsers, function(parser) {
      parser(state, errors, config);
    });
    requirements = [
      paletteRequirements(state, config)
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

    models.proj = ProjectionModel(config);
    models.palettes = PalettesModel(models, config);
    models.layers = LayersModel(models, config);
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
      models.proj.change = ProjectionChange(models, config);
    }

    elapsed('ui');
    // Create widgets
    ui.proj = ProjectionUI(models, config);
    ui.sidebar = LayersSidebar(models, config);
    ui.activeLayers = LayersActive(models, ui, config);
    ui.addModal = LayersModal(models, ui, config);

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
      if (!browser.small) { // If mobile device, do not build timeline
        timelineInit();
      }
      ui.dateWheels = DateWheels(models, config);
    }

    ui.rubberband = ImageRubberband(models, ui, config);
    ui.image = ImagePanel(models, ui, config);
    if (config.features.dataDownload) {
      ui.data = DataUI(models, ui, config);
      // FIXME: Why is this here?
      ui.data.render();
    }
    if (config.features.naturalEvents) {
      ui.naturalEvents = NaturalEventsUI(models, ui, config, NaturalEventsRequest(models, ui, config));
    }
    ui.link = linkUI(models, config);
    ui.tour = Tour(models, ui, config);
    ui.info = LinkInfo(ui, config);
    if (config.features.alert) {
      ui.alert = NotificationsUI(ui, config);
    }

    // FIXME: Old hack
    $(window)
      .resize(function() {
        if (browser.small) {
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
    debug.layers(ui, models, config);

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

    each(errors, function(error) {
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
