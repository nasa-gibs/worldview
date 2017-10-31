// Utils
import util from './util/wv.util'; // Maybe this is the time to remove the util file from core and put everything from there in the worldview-components util....
import browser from './util/wv.util.browser';
// Date
import {dateParse} from './date/wv.date'; // export default function parse!!!
import dateModel from './date/wv.date.model';
import DateLabel from './date/wv.date.label';
import DateWheels from './date/wv.date.wheels';
//Timeline
import Timeline from  './date/wv.date.timeline';
import TimelineData from './date/wv.date.timeline.data';
import TimelineConfig from './date/wv.date.timeline.config';
import TimelineZoom from './date/wv.date.timeline.zoom';
import TimelineTicks from './date/wv.date.timeline.ticks';
import TimelinePick from './date/wv.date.timeline.pick';
import TimelinePan from './date/wv.date.timeline.pan';
import TimelineConfig from './date/wv.date.timeline.config';
import TimelineInput from './date/wv.date.timeline.input';
// Layers
import {layerParse, layerValidate} from './layers/wv.layers';// export parse as layerParse. etc...
import LayersModel from './layers/wv.layers.model';
import LayersModal from './layers/wv.layers.modal';
import LayersSidebar from './layers/wv.layers.sidebar';
import LayersActive from './layers/wv.layers.active';
// Map
import {mapParse} from './map/wv.map';
import MapModel from './map/wv.map.model';
import MapUI from './map/wv.map.ui';
import MapRotate from './map/wv.map.rotate';
import MapRunningData from './map/wv.map.runningdata';
import MapLayerBuilder from './map/wv.map.layerbuilder';
import MapDatelineBuilder from './map/wv.map.datelinebuilder';
import MapPrecacheTile from './map/wv.map.precachetile';
import MapAnimate from './map/wv.map.animate';
// Animation
import {animParse} from './animation/wv.anim';
import AnimModel from './animation/wv.anim.model';
import AnimUI from './animation/wv.anim.ui';
import AnimWidget from './animation/animation-widget';
import AnimRangeselect from './animation/wv.anim.rangeselect';
import AnimGIF from './animation/wv.anim.gif';
// palettes
import {palettesParse, paletteRequirements} from './palettes/wv.palettes';
import PalettesModel from './palettes/wv.palettes.model';
// Data
import DataParse from './data/wv.data';
import DataModel from './data/wv.data.model';
import DataUI from './data/wv.data.ui';
// NaturalEvents
import EventsModel from './naturalEvents/wv.naturalEvents.model';
import EventsUI from './naturalEvents/wv.naturalEvents.ui';
import EventsRequest from './naturalEvents/wv.naturalEvents.request';
// Image
import ImageRubberband from './image/wv.image.rubberband';
import ImagePanel from './image/wv.image.panel';
// notifications
import NotificationsUI from './notifications/wv.notifications.ui';
// UI
import {indicateDelayed} from './ui/wv.ui.indicator'; // not a class, export object
// Link
import LinkModel from './link/wv.link.model';
import LinkUI from './link/wv.link.ui';
import LinkInfo from './link/wv.link.info';

// projections
import projParse from './proj/wv.proj';
import ProjModel from './proj/wv.proj.model';
import ProjUI from './proj/wv.proj.ui';
import ProjChange from './proj/wv.proj.change';
// other
import {debugConfig, debug} from './wv.debug';
import Brand from './wv.brand';
import Tour from './wv.tour';
// External Dependencies
import $ from 'Jquery';
import _ from 'lodash';
import {GA as googleAnalytics} from 'worldview-components';

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
    elapsed("start");
    /* May be included in next version
    yepnope({
        test: parameters.debug,
        yep: ['js/wv.debug.js'],
        complete: loadConfig
    });
    */
    loadConfig();
  };

  var loadConfig = function() {
    elapsed("loading config");
    var configURI = Brand.url("config/wv.json");
    var promise = $.getJSON(configURI);
    promise
      .done(util.wrap(onConfigLoaded))
      .fail(util.error);
    indicateDelayed(promise, 1000);
  };

  var onConfigLoaded = function(data) {
    elapsed("config loaded");
    config = data;
    config.parameters = parameters;

    // Export for debugging
    wvx.config = config;

    debugConfig(config);

    // Load any additional scripts as needed
    if (config.scripts) {
      _.each(config.scripts, function(script) {
        $.getScript(script);
      });
    }

    layerValidate(errors, config);

    parsers = [
      projParse,
      layerParse,
      dateParse,
      mapParse,
      palettesParse
    ];
    if (config.features.dataDownload) {
      parsers.push(DataParse);
    }
    if (config.features.animation) {
      parsers.push(animParse);
    }
    _.each(parsers, function(parser) {
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
    elapsed("init");
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

    models.proj = ProjModel(config);
    models.palettes = PalettesModel(models, config);
    models.layers = LayersModel(models, config);
    models.date = dateModel(config, {
      initial: initialDate
    });
    models.map = MapModel(models, config);
    models.link = LinkModel(config);

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
      models.anim = AnimModel(models, config);
      models.link.register(models.anim);
    }
    if (config.features.dataDownload) {
      models.data = DataModel(models, config);
      models.link.register(models.data);
    }
    if (config.features.naturalEvents) {
      models.naturalEvents = EventsModel(models, config, ui);
      models.link.register(models.naturalEvents);
    }
    // HACK: Map needs permalink state loaded before starting. But
    // data download now needs it too.
    models.link.load(state); // needs to be loaded twice

    if (config.features.arcticProjectionChange) {
      models.proj.change = ProjChange(models, config);
    }

    elapsed("ui");
    // Create widgets
    ui.proj = ProjUI(models, config);
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
        ui.anim.rangeselect = AnimRangeselect(models, config, ui); // SETS STATE: NEEDS TO LOAD BEFORE ANIMATION WIDGET
        ui.anim.widget = AnimWidget(models, config, ui);
        ui.anim.gif = AnimGIF(models, config, ui);
        ui.anim.ui = AnimUI(models, ui);
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
      ui.naturalEvents = EventsUI(models, ui, config, EventsRequest(models, ui, config));
    }
    ui.link = LinkUI(models, config);
    ui.tour = Tour(models, ui, config);
    ui.info = LinkInfo(ui, config);
    if (config.features.alert) {
      ui.alert = NotificationsUI(ui, config);
    }

    //FIXME: Old hack
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
    $("input")
      .blur();
    $("#eventsHolder")
      .hide();

    if (config.features.dataDownload) {
      models.data.events
        .on("activate", function() {
          ui.sidebar.selectTab("download");
        })
        .on("queryResults", function() {
          ui.data.onViewChange();
        });
      ui.map.events.on("extent", function() {
        ui.data.onViewChange();
      });
      // FIXME: This is a hack
      models.map.events.on("projection", models.data.updateProjection);
    }
    // Sink all focus on inputs if click unhandled
    $(document)
      .click(function(event) {
        if (event.target.nodeName !== "INPUT") {
          $("input")
            .blur();
        }
      });

    // Console notifications
    if (Brand.release()) {
      console.info(Brand.NAME + " - Version " + Brand.VERSION +
        " - " + Brand.BUILD_TIMESTAMP);
    } else {
      console.warn("Development version");
    }
    debug.layers(ui, models, config);

    errorReport();
    //wv.debug.error(parameters);

    models.wv.events.trigger("startup");
    elapsed("done");

    // Reset Worldview when clicking on logo
    $(document).click(function(e) {
      if (e.target.id == "wv-logo") resetWorldview(e);
    });
  };

  var resetWorldview = function(e){
    e.preventDefault();
    if (window.location.search === "") return; // Nothing to reset
    var msg = "Do you want to reset Worldview to its defaults? You will lose your current state.";
    if (confirm(msg)) document.location.href = "/";
  };

  var errorReport = function() {
    var layersRemoved = 0;

    _.each(errors, function(error) {
      var cause = (error.cause) ? ": " + error.cause : "";
      util.warn(error.message + cause);
      if (error.layerRemoved) {
        layersRemoved = layersRemoved + 1;
      }
    });

    if (layersRemoved > 0) {
      // Remove for now until new GIBS has settled down.
      /*
      wv.ui.notify(
          "Incomplete configuration<br><br>" +
          layersRemoved + " layer(s) were removed<br><br>" +
          "Contact us at " +
          "<a href='mailto:@MAIL@'>" +
          "@MAIL@</a>");
      */
    }
  };

  var elapsed = function(message) {
    if (!parameters.elapsed) return;
    var t = new Date()
      .getTime() - startTime;
    console.log(t, message);
  };

  /*
  var debuggingFeatures = function(config) {
      // Install a black palette which can be used to find "holes" in
      // LUT mappings.
      if ( config.parameters.debugPalette ) {
          var debugPalette = Worldview.Palette.Palette({
              id: "__DEBUG",
              name: "Debug",
              stops: [{at: 0, r: 0, g: 0, b: 0, a: 0}]
          });
          config.palettes["__DEBUG"] = debugPalette;
          config.paletteOrder.unshift("__DEBUG");
      }

      // Test error dialog
      if ( config.parameters.showError ) {
          *** SHOW ERROR
      }
  };
  */

  util.wrap(main)();

};