var wvx = wvx || {};

// Document ready function
$(function() {

  var config;
  var state = wv.util.fromQueryString(location.search);
  var parameters = wv.util.fromQueryString(location.search);
  var errors = [];
  var startTime;

  var main = function() {
    if (parameters.elapsed) startTime = new Date().getTime();
    elapsed('start');
    loadConfig();
  };

  var loadConfig = function() {
    elapsed('loading config');
    var configURI = wv.brand.url('config/wv.json');
    var promise = $.getJSON(configURI);
    promise
      .done(wv.util.wrap(onConfigLoaded))
      .fail(wv.util.error);
    wv.ui.indicator.delayed(promise, 1000);
  };

  var onConfigLoaded = function(data) {
    elapsed('config loaded');
    config = data;
    config.parameters = parameters;

    // Export for debugging
    wvx.config = config;

    wv.debug.config(config);

    // Load any additional scripts as needed
    if (config.scripts) {
      _.each(config.scripts, function(script) {
        $.getScript(script);
      });
    }

    wv.layers.validate(errors, config);

    parsers = [
      wv.proj.parse,
      wv.layers.parse,
      wv.date.parse,
      wv.map.parse,
      wv.palettes.parse
    ];
    if (config.features.dataDownload) {
      parsers.push(wv.data.parse);
    }
    if (config.features.animation) {
      parsers.push(wv.anim.parse);
    }
    _.each(parsers, function(parser) {
      parser(state, errors, config);
    });
    requirements = [
      wv.palettes.requirements(state, config)
    ];

    $.when.apply(null, requirements)
      .then(wv.util.wrap(init))
      .fail(wv.util.error);
  };

  var init = function() {
    elapsed('init');
    // If at the beginning of the day, wait on the previous day until GIBS
    // catches up (about three hours)
    var initialDate;
    if (config.defaults.startDate) {
      initialDate = wv.util.parseDateUTC(config.defaults.startDate);
    } else {
      initialDate = wv.util.now();
      if (initialDate.getUTCHours() < 3) {
        initialDate.setUTCDate(initialDate.getUTCDate() - 1);
      }
    }

    // Models
    var models = {
      wv: {
        events: wv.util.events()
      }
    };
    var ui = {};
    // Export for debugging
    wvx.models = models;
    wvx.ui = ui;

    models.proj = wv.proj.model(config);
    models.palettes = wv.palettes.model(models, config);
    models.layers = wv.layers.model(models, config);
    models.date = wv.date.model(config, {
      initial: initialDate
    });
    models.map = wv.map.model(models, config);
    models.link = wv.link.model(config);

    models.link
      .register(models.proj)
      .register(models.layers)
      .register(models.date)
      .register(models.palettes)
      .register(models.map);
    models.link.load(state);
    if (config.features.googleAnalytics) {
      WVC.GA.init(config.features.googleAnalytics.id); // Insert google tracking
    }
    // HACK: Map needs to be created before the data download model
    var mapComponents = {
      Rotation: wv.map.rotate,
      Runningdata: wv.map.runningdata,
      Layerbuilder: wv.map.layerbuilder,
      Dateline: wv.map.datelinebuilder,
      Precache: wv.map.precachetile
    };
    ui.map = wv.map.ui(models, config, mapComponents);
    ui.map.animate = wv.map.animate(models, config, ui);
    if (config.features.animation) {
      models.anim = wv.anim.model(models, config);
      models.link.register(models.anim);
    }
    if (config.features.dataDownload) {
      models.data = wv.data.model(models, config);
    }
    if (config.features.dataDownload) {
      models.link.register(models.data);
    }
    if (config.features.naturalEvents) {
      models.naturalEvents = wv.naturalEvents.model(models, config);
      models.link.register(models.naturalEvents);
    }
    // HACK: Map needs permalink state loaded before starting. But
    // data download now needs it too.
    models.link.load(state); // needs to be loaded twice

    if (config.features.arcticProjectionChange) {
      models.proj.change = wv.proj.change(models, config);
    }

    elapsed('ui');
    // Create widgets
    ui.proj = wv.proj.ui(models, config);
    ui.sidebar = wv.layers.sidebar(models, config);
    ui.activeLayers = wv.layers.active(models, ui, config);
    ui.addModal = wv.layers.modal(models, ui, config);


    function timelineInit() {
      ui.timeline = wv.date.timeline(models, config, ui);
      ui.timeline.data = wv.date.timeline.data(models, config, ui);
      ui.timeline.zoom = wv.date.timeline.zoom(models, config, ui);
      ui.timeline.ticks = wv.date.timeline.ticks(models, config, ui);
      ui.timeline.pick = wv.date.timeline.pick(models, config, ui);
      ui.timeline.pan = wv.date.timeline.pan(models, config, ui);
      ui.timeline.config = wv.date.timeline.config(models, config, ui);
      ui.timeline.input = wv.date.timeline.input(models, config, ui);
      if (config.features.animation) {
        ui.anim = {};
        ui.anim.rangeselect = wv.anim.rangeselect(models, config, ui); // SETS STATE: NEEDS TO LOAD BEFORE ANIMATION WIDGET
        ui.anim.widget = wv.anim.widget(models, config, ui);
        ui.anim.gif = wv.anim.gif(models, config, ui);
        ui.anim.ui = wv.anim.ui(models, ui);
      }

      ui.dateLabel = wv.date.label(models);
    }
    if (config.startDate) {
      if (!wv.util.browser.small) { // If mobile device, do not build timeline
        timelineInit();
      }
      ui.dateWheels = wv.date.wheels(models, config);
    }

    ui.rubberband = wv.image.rubberband(models, ui, config);
    ui.image = wv.image.panel(models, ui, config);
    if (config.features.dataDownload) {
      ui.data = wv.data.ui(models, ui, config);
      // FIXME: Why is this here?
      ui.data.render();
    }
    if (config.features.naturalEvents) {
      ui.naturalEvents = wv.naturalEvents.ui(models, ui, config, wv.naturalEvents.request(models, ui, config));
    }
    ui.link = wv.link.ui(models, config);
    ui.tour = wv.tour(models, ui, config);
    ui.info = wv.ui.info(ui, config);
    if (config.features.alert) {
      ui.alert = wv.notifications.ui(ui, config);
    }

    //FIXME: Old hack
    $(window)
      .resize(function() {
        if (wv.util.browser.small) {
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
    if (wv.brand.release()) {
      console.info(wv.brand.NAME + ' - Version ' + wv.brand.VERSION +
        ' - ' + wv.brand.BUILD_TIMESTAMP);
    } else {
      console.warn('Development version');
    }
    wv.debug.layers(ui, models, config);

    errorReport();
    //wv.debug.error(parameters);

    models.wv.events.trigger('startup');
    elapsed('done');

    // Reset Worldview when clicking on logo
    $(document).click(function(e) {
      if (e.target.id == 'wv-logo') resetWorldview(e);
    });
  };

  var resetWorldview = function(e){
    e.preventDefault();
    if (window.location.search === '') return; // Nothing to reset
    var msg = 'Do you want to reset Worldview to its defaults? You will lose your current state.';
    if (confirm(msg)) document.location.href = '/';
  };

  var errorReport = function() {
    var layersRemoved = 0;

    _.each(errors, function(error) {
      var cause = (error.cause) ? ': ' + error.cause : '';
      wv.util.warn(error.message + cause);
      if (error.layerRemoved) {
        layersRemoved = layersRemoved + 1;
      }
    });
  };

  var elapsed = function(message) {
    if (!parameters.elapsed) return;
    var t = new Date().getTime() - startTime;
    console.log(t, message);
  };

  wv.util.wrap(main)();

});
