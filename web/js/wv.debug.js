/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 - 2014 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */

/**
 * @module wv.debug
 */
var wv = wv || {};
wv.debug = wv.debug || (function() {

  var parameters = wv.util.fromQueryString(location.search);
  var self = {};

  var init = function() {
    if (parameters.loadDelay) {
      var delay;
      try {
        delay = parseInt(parameters.loadDelay);
        self.loadDelay(delay);
      } catch (error) {
        console.warn("Invalid load delay: " + delay);
        return;
      }
    }
    if (parameters.showError) {
      $(function() {
        wv.util.error();
      });
    }
  };

  var delayedCallback = function(jqXHR, wrap, delay) {
    return function(fn) {
      wrap(function() {
        var args = arguments;
        setTimeout(function() {
          if (fn) {
            fn.apply(jqXHR, args);
          }
        }, delay);
      });
      return jqXHR;
    };
  };

  self.loadDelay = function(delay) {
    var ajax = $.ajax;
    $.ajax = function() {
      var ajaxArgs = arguments;
      console.log("delay", delay, ajaxArgs);
      var jqXHR = ajax.apply($, arguments);

      var done = jqXHR.done;
      jqXHR.done = delayedCallback(jqXHR, done, delay);
      jqXHR.done(function() {
        console.log("done", ajaxArgs);
      });

      var fail = jqXHR.fail;
      jqXHR.fail = delayedCallback(jqXHR, fail, delay);
      jqXHR.fail(function() {
        console.log("fail", ajaxArgs);
      });

      var always = jqXHR.always;
      jqXHR.always = delayedCallback(jqXHR, always, delay);

      return jqXHR;
    };
  };

  init();
  return self;

})();

wv.debug.config = wv.debug.config || function(config) {
  if (config.parameters.debug === "tiles") {
    var tileSize = _.parseInt(config.parameters.tileSize);
    if (_.isNaN(tileSize)) {
      throw new Error("No tileSize specified");
    }
    console.log("Debugging tiles with size", tileSize);
    config.layers.debug_tile = {
      id: "debug_tile",
      title: "Debug Tiles",
      subtitle: "Worldview",
      tags: "debug",
      group: "overlays",
      format: "image/svg",
      type: "wmts",
      noTransition: "true",
      projections: {}
    };
    _.each(config.projections, function(proj) {
      config.layers.debug_tile.projections[proj.id] = {
        "source": "debug_tile",
        "matrixSet": tileSize
      };
    });
    config.sources.debug_tile = {
      url: "service/debug_tile.cgi",
      matrixSets: {}
    };
    config.sources.debug_tile.matrixSets[tileSize] = {
      id: tileSize,
      tileSize: [tileSize, tileSize]
    };
    config.layerOrder.push("debug_tile");
    config.defaults.startingLayers.push({
      id: "debug_tile"
    });
  }
};

wv.debug.layers = wv.debug.layers || function(ui, models, config) {

  var type;
  var selectedLayer;

  var useDebugPanel = {
    "gibs": true,
    "layers": true,
    "palettes": true,
    "dataDownload": true
  };

  var init = function() {
    type = config.parameters.debug;
    if (config.parameters.debugGIBS) {
      type = "gibs";
    }
    if (type === "gibs") {
      ui.sidebar.collapse();
      //ui.dateSliders.collapse();
    }
    if (useDebugPanel[type]) {
      if (type === "palettes") {
        wv.palettes.loadCustom(config)
          .done(render);
      } else {
        render();
      }
    }
  };

  var render = function(type) {
    var $div = $(
      "<div id='wv-debug-gibs'>" +
      "<div class='wv-debug-gibs-layer'>" +
      "<button class='wv-debug-gibs-previous-layer'>-</button>" +
      "<button class='wv-debug-gibs-next-layer'>+</button>" +
      "<select class='wv-debug-gibs-layerlist'></select>" +
      "</div>" +
      "<div class='wv-debug-gibs-date'>" +
      "<button class='wv-debug-gibs-previous-date'>-</button>" +
      "<button class='wv-debug-gibs-next-date'>+</button>" +
      "<span class='wv-debug-gibs-date-label'>Date</span>" +
      "</div>" +
      "</div>");
    $("body")
      .append($div);

    initLayers();
    var $select = $(".wv-debug-gibs-layerlist");
    $select.on("change", updateLayers);
    models.date.events.on("select", updateDate);
    models.proj.events.on("select", initLayers);

    $(".wv-debug-gibs-next-layer")
      .click(nextLayer);
    $(".wv-debug-gibs-previous-layer")
      .click(previousLayer);

    $(".wv-debug-gibs-next-date")
      .click(nextDate);
    $(".wv-debug-gibs-previous-date")
      .click(previousDate);

    updateDate();
  };

  var acceptLayer = function(layer) {
    var proj = models.proj.selected.id;
    if (!layer.projections[proj]) {
      return false;
    }
    if (layer.id === "Land_Water_Map" || layer.id === "Land_Mask") {
      return false;
    }
    if (type === "gibs" && layer.period === "daily" && layer.type === "wmts") {
      return true;
    }
    if (type === "palettes" && layer.palette && !layer.palette.immutable) {
      return true;
    }
    if (type === "dataDownload" && layer.product) {
      return true;
    }
    return type === "layers";
  };

  var initLayers = function() {
    var $select = $(".wv-debug-gibs-layerlist");
    $select.empty();
    var proj = models.proj.selected.id;
    var sortedLayers = _.sortBy(config.layers, ["title", "subtitle"]);
    _.each(sortedLayers, function(layer) {
      if (acceptLayer(layer)) {
        var names = models.layers.getTitles(layer.id);
        var text = names.title + "; " + names.subtitle;
        if (text.length > 65) {
          text = text.substr(0, 65) + "...";
        }
        console.log(layer.id);
        var $option = $("<option></option>")
          .val(encodeURIComponent(layer.id))
          .html(text);
        $select.append($option);
      }
    });
    models.layers.clear();
    if (type !== "gibs" && config.layers.Land_Water_Map) {
      models.layers.add("Land_Water_Map");
    }
    updateLayers.apply($select);
    if (type === "dataDownload") {
      models.data.activate();
    }
  };

  var updateLayers = function() {
    if (!$(this)
      .val()) {
      return;
    }
    var layerId = decodeURIComponent($(this)
      .val());
    var names = models.layers.getTitles(layerId);
    console.log(names.title + "; " + names.subtitle);
    if (selectedLayer) {
      models.layers.remove(selectedLayer);
      models.palettes.clearCustom(selectedLayer);
    }
    models.layers.add(layerId);
    if (type !== "gibs") {
      var range = models.layers.dateRange();
      if (range && (config.parameters && !config.parameters.ignoreRange)) {
        range.end.setUTCDate(range.end.getUTCDate() - 1);
        models.date.select(range.end);
      }
    }
    selectedLayer = layerId;
    if (type === "palettes") {
      wv.palettes.loadRendered(config, layerId)
        .done(function() {
          var layer = config.layers[layerId];
          var palette = config.palettes.rendered[layerId];
          if (layer.palette.recommended) {
            models.palettes.setCustom(layerId, layer.palette.recommended[0]);
          } else {
            if (palette.scale) {
              models.palettes.setCustom(layerId, "rainbow_2");
            } else {
              models.palettes.setCustom(layerId, "blue_light");
            }
          }
        });
    }
  };

  var nextLayer = function() {
    $(".wv-debug-gibs-layerlist option:selected")
      .next()
      .attr("selected", "selected");
    updateLayers.apply($(".wv-debug-gibs-layerlist"));
  };

  var previousLayer = function() {
    $(".wv-debug-gibs-layerlist option:selected")
      .prev()
      .attr("selected", "selected");
    updateLayers.apply($(".wv-debug-gibs-layerlist"));
  };

  var updateDate = function() {
    $(".wv-debug-gibs-date-label")
      .html(
        wv.util.toISOStringDate(models.date.selected));
  };

  var nextDate = function() {
    var d = new Date(models.date.selected.getTime());
    d.setUTCDate(d.getUTCDate() + 1);
    models.date.select(d);
  };

  var previousDate = function() {
    var d = new Date(models.date.selected.getTime());
    d.setUTCDate(d.getUTCDate() - 1);
    models.date.select(d);
  };

  init();
};
