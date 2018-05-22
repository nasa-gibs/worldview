import $ from 'jquery';
import lodashEach from 'lodash/each';
import lodashFirst from 'lodash/first';
import lodashLast from 'lodash/last';
import util from '../util/util';
import palettes from './palettes';

export function palettesLegend(spec) {
  var selector = spec.selector;
  var config = spec.config;
  var model = spec.models.palettes;
  var ui = spec.ui;
  var layer = spec.layer;
  var loaded = false;
  var rendered = false;

  var self = {};

  var init = function () {
    var paletteId = layer.palette.id;
    if (config.palettes.rendered[paletteId]) {
      loaded = true;
      render();
    } else {
      palettes.loadRendered(config, layer.id)
        .done(function () {
          if (!loaded) {
            loaded = true;
            render();
            if (spec.onLoad) {
              spec.onLoad();
            }
          }
        });
    }
  };

  var render = function () {
    var $parent = $(selector);

    var $legendPanel = $('<div></div>')
      .addClass('wv-palettes-panel')
      .attr('data-layer', layer.id)
      .attr('id', layer.id + '_panel');
    $parent.append($legendPanel);
    var legends = model.getLegends(layer.id);
    lodashEach(legends, function (legend, index) {
      if ((legend.type === 'continuous') ||
        (legend.type === 'discrete')) {
        renderScale($legendPanel, legend, index, layer.id);
      }
      if (legend.type === 'classification') {
        renderClasses($legendPanel, index);
      }
    });
    self.update();
  };

  var renderScale = function ($legendPanel, legend, index, layerId) {
    var $container = $('<div></div>')
      .addClass('wv-palettes-legend')
      .attr('data-index', index);
    var $colorBarCase = $('<div></div>')
      .addClass('colorbar-case');
    var $colorbar = $('<canvas></canvas>')
      .addClass('wv-palettes-colorbar')
      .attr('data-index', index);
    var $runningDataPointBar = $('<div></div>')
      .addClass('wv-running-bar');
    // set fixed canvas dimensions
    $colorbar[0].width = 235;
    $colorbar[0].height = 12;
    $colorBarCase
      .append($colorbar)
      .append($runningDataPointBar);
    $container.append($colorBarCase);

    var $runningDataPointLabel = $('<span></span>')
      .addClass('wv-running-label');

    var $min = $('<div></div>')
      .addClass('wv-palettes-min');
    var $max = $('<div></div>')
      .addClass('wv-palettes-max');
    var $title = $('<div></div>')
      .addClass('wv-palettes-title');
    $container.prepend($title);

    $container
      .append($min)
      .append($max)
      .append($runningDataPointLabel);

    $colorbar.on('mousemove', function (e) {
      showUnitHover(e, index);
    });
    $colorbar.on('mouseout', hideUnitsOnMouseOut);
    $legendPanel.append($container);
    palettes.colorbar(selector + ' ' +
      '[data-index=\'' + index + '\'] canvas', legend.colors);
  };
  var renderClasses = function ($legendPanel, index) {
    var $panel = $('<div></div>')
      .addClass('wv-palettes-legend')
      .addClass('wv-palettes-classes')
      .attr('data-index', index);
    $legendPanel
      .append($panel);
  };

  var updateClasses = function (legend, index) {
    var $panel = $(selector + ' [data-index=\'' + index + '\']');
    $panel.empty();
    lodashEach(legend.colors, function (color, classIndex) {
      var $colorBox = $('<span></span>')
        .attr('data-index', index)
        .attr('data-class-index', classIndex)
        .attr('data-hex', color)
        .addClass('wv-palettes-class')
        .html('&nbsp;')
        .css('background-color', util.hexToRGB(color))
        .hover(highlightClass, unhighlightClass);
      $panel.append($colorBox);
      // Calls running data
      $colorBox.on('mouseenter', showClassUnitHover);
      $colorBox.on('mouseout', hideUnitsOnMouseOut);
    });
    var $runningDataPointLabel = $('<span></span>')
      .addClass('wv-running-category-label');
    $panel.append($runningDataPointLabel);
    // TODO: Review this each loop. It can probably be removed.
    var $detailPanel = $('<div></div>');
    lodashEach(legend.colors, function (color, classIndex) {
      var label = legend.tooltips[classIndex];
      label = (legend.units) ? label + ' ' + legend.units : label;
      var $row = $('<div></div>')
        .addClass('wv-palettes-class-detail')
        .attr('data-class-index', classIndex);
      $row.append(
        $('<span></span>')
          .addClass('wv-palettes-class')
          .html('&nbsp;')
          .css('background-color', util.hexToRGB(color)))
        .append($('<span></span>')
          .addClass('wv-palettes-class-label')
          .attr('data-index', index)
          .attr('data-class-index', classIndex)
          .html(label));
      $detailPanel.append($row);
    });
    if (!rendered) {
      rendered = true;
    }
  };

  self.update = function () {
    if (!loaded) {
      return;
    }
    var legends = model.getLegends(layer.id);
    lodashEach(legends, function (legend, index) {
      if ((legend.type === 'continuous') ||
        (legend.type === 'discrete')) {
        palettes.colorbar(selector + ' ' +
          '[data-index=\'' + index + '\'] canvas', legend.colors);
        showUnitRange(index);
      } else if (legend.type === 'classification') {
        updateClasses(legend, index);
      }
    });
  };

  var showUnitRange = function (index) {
    if (!loaded) {
      return;
    }
    var legends = model.getLegends(layer.id, index);

    lodashEach(legends, function (legend, index) {
      var min = legend.minLabel || lodashFirst(legend.tooltips);
      var max = legend.maxLabel || lodashLast(legend.tooltips);
      min = (legend.units) ? min + ' ' + legend.units : min;
      max = (legend.units) ? max + ' ' + legend.units : max;
      $(selector + ' [data-index=\'' + index + '\'] .wv-palettes-min')
        .html(min);
      $(selector + ' [data-index=\'' + index + '\'] .wv-palettes-max')
        .html(max);
      var title = legend.title || '&nbsp;';
      if (legends.length === 1) {
        $(selector + ' [data-index=\'' + index + '\'] .wv-palettes-title')
          .hide();
      } else {
        $(selector + ' [data-index=\'' + index + '\'] .wv-palettes-title')
          .html(title);
      }
    });
  };
  /**
   * get color from canvas bar and
   * send it to data processing
   *
   * @method showUnitHover
   * @static
   * @param {MouseEvent} e
   * @return {void}
   */
  var showUnitHover = function (e, index) {
    var rgba, x, y, legends, offset, hex;
    if (!loaded) {
      return;
    }
    legends = model.getLegends(layer.id)[index];
    offset = $(e.currentTarget)
      .offset();
    x = e.pageX - offset.left;
    y = e.pageY - offset.top;
    rgba = util.getCanvasPixelData(e.currentTarget, x, y);
    hex = util.rgbaToHex(rgba[0], rgba[1], rgba[2]);
    ui.map.runningdata.newLegend(legends, hex, layer.id);
  };

  /**
   * get color from data attr and
   * send it to data processing and
   * render legend
   *
   * @method showClassUnitHover
   * @static
   * @param {MouseEvent} e
   * @return {void}
   */
  var showClassUnitHover = function (e) {
    var hex = $(this)
      .data('hex');
    var legends = model.getLegends(layer.id)[0];
    ui.map.runningdata.newLegend(legends, hex, layer.id);
  };

  /**
   * get color from data attr and
   * send it to data processing and
   * render legend
   *
   * @method showClassUnitHover
   * @static
   * @param {MouseEvent} e
   * @return {void}
   */
  var hideUnitsOnMouseOut = function () {
    ui.map.runningdata.clearAll();
  };

  var highlightClass = function () {
    var legendIndex = $(this)
      .attr('data-index');
    var classIndex = $(this)
      .attr('data-class-index');
    $('.wv-palettes-class-label[data-index=\'' + legendIndex + '\']' +
        '[data-class-index=\'' + classIndex + '\']')
      .addClass('wv-palettes-class-highlight');
  };

  var unhighlightClass = function () {
    var legendIndex = $(this)
      .attr('data-index');
    var classIndex = $(this)
      .attr('data-class-index');
    $('.wv-palettes-class-label[data-index=\'' + legendIndex + '\']' +
        '[data-class-index=\'' + classIndex + '\']')
      .removeClass('wv-palettes-class-highlight');
  };

  init();
  return self;
};
