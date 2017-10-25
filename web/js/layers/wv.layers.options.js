var wv = wv || {};
wv.layers = wv.layers || {};

wv.layers.options = wv.layers.options || function(config, models, layer) {

  var alignTo = "#products";
  var $dialog;
  var $opacity;
  var $range;
  var $dropDown;
  var self = {};
  var canvas;
  var palettes;
  var index = 0;

  var init = function() {
    canvas = document.createElement("canvas");
    canvas.width = 120;
    canvas.height = 10;
    if (config.features.customPalettes) {
      wv.palettes.loadCustom(config)
        .done(loaded);
    } else {
      loaded();
    }
  };

  var loaded = function(custom) {
    $dialog = wv.ui.getDialog();
    $dialog
      .attr("id", "wv-layers-options-dialog")
      .attr("data-layer", layer.id);
    renderOpacity($dialog);

    if (config.features.customPalettes) {
      if (models.palettes.allowed(layer.id) &&
        (models.palettes.getLegends(layer.id)
          .length < 2)) {
        //TODO: Dual Colormap options
        /*if ( models.palettes.getLegends(layer.id).length > 1 ) {
          renderLegendButtons($dialog);
          }*/
        var legend = models.palettes.getLegend(layer.id, index);
        if ((legend.type === "continuous") ||
          (legend.type === "discrete")) {
          renderRange($dialog);
          if (config.layers[layer.id].type !== "wms") {
            renderPaletteSelector($dialog);
          }
        } else if (models.palettes.getDefaultLegend(layer.id, index)
          .colors.length === 1) {
          if (config.layers[layer.id].type !== "wms") {
            renderPaletteSelector($dialog);
          }
        }
      }
    }
    var names = models.layers.getTitles(layer.id);
    $dialog.dialog({
      dialogClass: "wv-panel",
      title: names.title,
      show: {
        effect: "slide",
        direction: "left"
      },
      width: 300,
      height: "auto",
      resizable: false,
      draggable: false,
      position: {
        my: "left top",
        at: "right+5 top",
        of: $("#products")
      },
      close: dispose
    });

    $("#wv-squash-button-check")
      .addClass("custom-check");
    $("#wv-palette-selector")
      .addClass("custom-check");
    $("#wv-layers-options-dialog .custom-check")
      .iCheck({
        radioClass: 'iradio_square-grey',
        checkboxClass: 'icheckbox_square-grey'
      });

    $("#wv-layers-options-dialog #wv-palette-selector")
      .each(function() {
        $(this)
          .perfectScrollbar('update');
      });

    $("#wv-squash-button-check")
      .on("ifChanged", function() {
        var squash = $("#wv-squash-button-check")
          .prop("checked");
        //var $slider = $("#wv-range-slider");
        var $slider = $range;
        models.palettes.setRange(layer.id,
          parseFloat($slider.val()[0]),
          parseFloat($slider.val()[1]),
          squash,
          index);
      });

    models.layers.events
      .on("remove", onLayerRemoved)
      .on("opacity", onOpacityUpdate);
    models.palettes.events
      .on("range", onRangeUpdate)
      .on("update", onPaletteUpdateAll);
  };

  var dispose = function() {
    models.layers.events
      .off("remove", onLayerRemoved)
      .off("opacity", onOpacityUpdate);
    models.palettes.events
      .off("range", onRangeUpdate)
      .off("update", onPaletteUpdateAll);
    $dialog = null;
    wv.ui.closeDialog();
  };

  var renderOpacity = function($dialog) {
    var $header = $("<div></div>")
      .html("Opacity")
      .addClass("wv-header");
    var $slider = $("<div></div>")
      .noUiSlider({
        start: layer.opacity,
        step: 0.01,
        range: {
          min: 0,
          max: 1
        },
      })
      .on("slide", function() {
        models.layers.setOpacity(layer.id, parseFloat($(this)
          .val()));
      });
    var $label = $("<div></div>")
      .addClass("wv-label")
      .addClass("wv-label-opacity");
    $dialog.append($header);
    $dialog.append($slider);
    $dialog.append($label);
    $opacity = $slider;
    onOpacityUpdate(layer, layer.opacity);
  };

  var onOpacityUpdate = function(def, opacity) {
    if (def.id !== layer.id) {
      return;
    }
    var label = (opacity * 100)
      .toFixed(0) + "%";
    $("#wv-layers-options-dialog .wv-label-opacity")
      .html(label);
    if ($opacity.val() !== opacity) {
      $opacity.val(opacity);
    }
  };

  var renderLegendButtons = function($dialog) {
    var $panel = $("<div></div>")
      .addClass("wv-legend-buttons");
    var legends = models.palettes.getLegends(layer.id);

    _.each(legends, function(legend, index) {

      id = "wv-legend-" + index;
      $panel.append("<input type='radio' id='" + id + "' " +
        "name='legend' value='" + index + "'>" +
        "<label for='" + id + "'>" + legend.title + "</label>");
    });
    $panel.buttonset();
    $dialog.append($panel);

    $(".wv-legend-buttons input[type='radio']")
      .change(function() {
        index = _.parseInt($(this)
          .val());
        rerenderRange();
        rerenderPaletteSelector();
      });
  };

  var renderRange = function() {
    var $header = $("<div></div>")
      .html("Thresholds")
      .addClass("wv-header");

    var $squash = $("<div></div>")
      .addClass("wv-palette-squash");
    var $squashButton = $("<input></input>")
      .attr("type", "checkbox")
      .attr("id", "wv-squash-button-check");
    var $squashLabel = $("<label></label>")
      .attr("for", "wv-squash-button-check")
      .attr("title", "Squash Palette")
      .html("Squash Palette");
    $squash.append($squashButton)
      .append($squashLabel);

    var $panel = $("<div></div>")
      .addClass("wv-layer-options-threshold");
    $dialog.append($header);
    $dialog.append($squash);
    $dialog.append($panel);
    rerenderRange();
  };

  var rerenderRange = function() {
    var legend = models.palettes.get(layer.id, index);
    var max = legend.entries.values.length - 1;

    var startMin = legend.min || 0;
    var startMax = legend.max || max;

    var $slider = $("<div></div>")
      .noUiSlider({
        start: [startMin, startMax],
        step: 1,
        range: {
          min: 0,
          max: max
        }
      })
      .on("set", function() {
        var squash = $("#wv-squash-button-check")
          .prop("checked");
        models.palettes.setRange(layer.id,
          parseFloat($(this)
            .val()[0]),
          parseFloat($(this)
            .val()[1]),
          squash,
          index);
      })
      .on("slide", function() {
        updateRangeLabels(
          parseFloat($(this)
            .val()[0]),
          parseFloat($(this)
            .val()[1]));
      });
    var $label = $("<div>&nbsp;</div>")
      .addClass("wv-label");
    $label.append($("<span></span>")
      .addClass("wv-label-range-min"));
    $label.append($("<span></span>")
      .addClass("wv-label-range-max"));

    $(".wv-layer-options-threshold")
      .empty()
      .append($slider)
      .append($label);
    $range = $slider;
    $range = $slider;

    onRangeUpdate();
  };

  var onRangeUpdate = function() {
    updateRangeLabels();

    var palette = models.palettes.get(layer.id, index);
    var imin = (_.isUndefined(palette.min)) ? 0 : palette.min;
    var imax = (_.isUndefined(palette.max)) ?
      palette.legend.tooltips.length - 1 : palette.max;
    current = [parseFloat($range.val()[0]), parseFloat($range.val()[1])];
    if (!_.isEqual(current, [imin, imax])) {
      $range.val([imin, imax]);
    }

    if (palette.squash) {
      $("#wv-squash-button-check")
        .iCheck("check");
    } else {
      $("#wv-squash-button-check")
        .iCheck("uncheck");
    }
  };

  var updateRangeLabels = function(min, max) {
    var palette = models.palettes.get(layer.id, index);
    var legend = models.palettes.getLegend(layer.id, index);
    min = min || palette.min || 0;
    max = max || palette.max || legend.tooltips.length - 1;
    var minLabel = (legend.units) ? legend.tooltips[min] + " " + legend.units : legend.tooltips[min];
    var maxLabel = (legend.units) ? legend.tooltips[max] + " " + legend.units : legend.tooltips[max];
    $("#wv-layers-options-dialog .wv-label-range-min")
      .html(minLabel);
    $("#wv-layers-options-dialog .wv-label-range-max")
      .html(maxLabel);
  };

  var onPaletteUpdateAll = function() {
    onRangeUpdate();
    onPaletteUpdate();
  };

  var renderPaletteSelector = function($dialog) {
    var $header = $("<div></div>")
      .addClass("wv-header")
      .addClass("wv-color-palette-label")
      .html("Color Palette");
    var $pane = $("<div></div>")
      .attr("id", "wv-palette-selector");
    $dialog.append($header)
      .append($pane);
    rerenderPaletteSelector(true);
  };

  var rerenderPaletteSelector = function(firstTime) {
    var $pane = $("#wv-palette-selector")
      .empty();
    $pane.append(defaultLegend());
    var recommended = layer.palette.recommended || [];
    _.each(recommended, function(id) {
      var item = customLegend(id);
      if (item) {
        $pane.append(item);
      }
    });
    _.each(config.paletteOrder, function(id) {
      if (_.indexOf(recommended, id) < 0) {
        var item = customLegend(id);
        if (item) {
          $pane.append(item);
        }
      }
    });
    $dialog.append($pane);
    $pane.perfectScrollbar();

    var palette = models.palettes.get(layer.id, index);
    if (palette.custom) {
      $(".wv-palette-selector-row input[data-palette='" +
          palette.custom + "']")
        .iCheck("check");
    } else {
      $(".wv-palette-selector-row input[data-palette='__default']")
        .iCheck("check");
    }

    $("#wv-palette-selector input")
      .on("ifChecked", function() {
        var that = this;
        setTimeout(function() {
          var id = $(that)
            .attr("data-palette");
          if (id === "__default") {
            models.palettes.clearCustom(layer.id, index);
          } else {
            models.palettes.setCustom(layer.id, id, index);
          }
        }, 0);
      });

    if (!firstTime) {
      $("#wv-palette-selector")
        .iCheck({
          radioClass: 'iradio_square-grey'
        });
    }
  };

  var onPaletteUpdate = function() {
    var palette = models.palettes.get(layer.id, index);
    if (palette.custom) {
      $("#wv-palette-selector input[data-palette='" + palette.custom + "']")
        .iCheck("check");
    } else {
      $("#wv-palette-selector input[data-palette='__default']")
        .iCheck("check");
    }
  };

  var selectorItemScale = function(palette, id, description) {
    wv.palettes.colorbar(canvas, palette);

    var $row = $("<div></div>")
      .addClass("wv-palette-selector-row");
    var $radio = $("<input></input>")
      .attr("type", "radio")
      .attr("id", "wv-palette-radio-" + id)
      .attr("name", "wv-palette-radio")
      .attr("data-palette", id);

    var $label = $("<label></label>")
      .attr("for", "wv-palette-radio-" + id);
    var $image = $("<img></img>")
      .attr("src", canvas.toDataURL("image/png"));
    var $description = $("<span></span>")
      .addClass("wv-palette-label")
      .html(description);
    $label.append($image);
    $label.append($description);

    $row.append($radio);
    $row.append($label);

    return $row;
  };

  var selectorItemSingle = function(palette, id, description) {
    var $row = $("<div></div>")
      .addClass("wv-palette-selector-row");
    var $radio = $("<input></input>")
      .attr("type", "radio")
      .attr("id", "wv-palette-radio-" + id)
      .attr("name", "wv-palette-radio")
      .attr("data-palette", id);

    var color = (palette.classes) ? palette.classes.colors[0] : palette.colors[0];
    var $label = $("<label></label>")
      .attr("for", "wv-palette-radio-" + id);
    var $image = $("<span></span>")
      .addClass("wv-palettes-class")
      .css("background-color", wv.util.hexToRGB(color))
      .html("&nbsp;");
    var $description = $("<span></span>")
      .html(description)
      .addClass("wv-palette-label");
    $label.append($image);
    $label.append($description);

    $row.append($radio);
    $row.append($label);

    return $row;
  };

  var defaultLegend = function() {
    var legend = models.palettes.getDefaultLegend(layer.id, index);
    if ((legend.type === "continuous") || (legend.type === "discrete")) {
      return selectorItemScale(legend.colors, "__default", "Default");
    } else {
      return selectorItemSingle(legend, "__default", "Default");
    }
  };

  var customLegend = function(id) {
    var source = models.palettes.getDefaultLegend(layer.id, index);
    var target = models.palettes.getCustom(id);
    var targetType = (target.colors.length === 1) ? "classification" : "continuous";

    if ((source.type === "continuous" && targetType === "continuous") ||
      (source.type === "discrete" && targetType === "continuous")) {
      var translated = wv.palettes.translate(source.colors,
        target.colors);
      return selectorItemScale(translated, id, target.name);
    }
    if (source.type === "classification" && targetType === "classification") {
      return selectorItemSingle(target, id, target.name);
    }
  };

  var onLayerRemoved = function(removedLayer) {
    if (layer.id === removedLayer.id && $dialog) {
      $dialog.dialog("close");
    }
  };

  init();
  return self;

};
