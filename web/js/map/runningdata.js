import $ from 'jquery';
import util from '../util/util';
import lodashDifference from 'lodash/difference';
import lodashEach from 'lodash/each';

export function MapRunningData(models) {
  var self;
  var $productsBox;
  var productsBoxHeight;
  var productsBoxTop;
  var productsBoxBottom;

  self = this;

  self.layers = [];
  self.prePixelData = [];
  self.pixel = null;
  self.oldLayers = [];

  self.init = function () {
    $productsBox = $('#products');
    productsBoxHeight = $productsBox.height();
    productsBoxTop = $productsBox.scrollTop();
    productsBoxBottom = productsBoxTop + productsBoxHeight;
    models.layers.events.on('change', function () { // when layers are added or removed
      // hacky timeout that allows onchange changes to render
      setTimeout(function () {
        productsBoxHeight = $productsBox.height();
        productsBoxBottom = productsBoxTop + productsBoxHeight;
      }, 300);
    });

    /*
     * A scroll event listener that updates
     * the location of scroller
     */
    $productsBox.on('scroll', function () {
      productsBoxTop = $productsBox.scrollTop();
      productsBoxBottom = productsBoxTop + productsBoxHeight;
    });
  };

  /*
   * Retrieves the label, length and index of
   * of the label from the palette scale object
   *
   * @method getDataLabel
   *
   * @param {object} scale - pallete scale object
   *  contains 3 arrays:
   *    scale.colors
   *    scale.labels
   *    scale.values
   *
   * @param {String} hex - color value
   *
   * @return {object}
   */
  self.getDataLabel = function (legend, hex) {
    var units = legend.units || '';
    // for(var i = 0, len = legend.colors.length; i < len; i++)  {
    //     if(legend.colors[i] === hex) {
    //         return {
    //             label: legend.tooltips[i] + ' ' + units,
    //             len: len,
    //             index:i
    //         };
    //     }
    // }

    for (var i = 0, len = legend.colors.length; i < len; i++) {
      if (util.hexColorDelta(legend.colors[i], hex) < 5) { // If the two colors are close
        return {
          label: legend.tooltips[i] + ' ' + units,
          len: len,
          index: i
        };
      }
    }
    return undefined;
  };

  /*
   * Gets the point in which to place the running
   * data value label
   *
   * @method getLabelMarginLeft
   *
   * @param {Number} labelWidth - width of label
   *
   * @param {Number} caseWidth - width of palette case
   *
   * @param {Number} location - location of point on palette
   *
   * @return {number} margin-left value of label
   *
   */
  self.getLabelMarginLeft = function (labelWidth, caseWidth, location, marginLeft) {
    var offsetLeft = location + marginLeft - (labelWidth / 2);
    if (offsetLeft + labelWidth > caseWidth) {
      offsetLeft = caseWidth - labelWidth;
    } else if (offsetLeft < 5) {
      offsetLeft = 5;
    }
    return offsetLeft;
  };

  /*
   * Determine is layer legend is Visible
   *
   * @method layerIsInView
   *
   * @param {String} Layers Id
   *
   * @return {Boolean} legend is visible
   *
   */
  var layerIsInView = function (layerID) {
    var elTop;
    var elBottom;
    var $case = $('.productsitem[data-layer=\'' + layerID + '\']');
    if ($case[0]) {
      elTop = $case[0].offsetTop;
      elBottom = elTop + $case.height();
      if ((elTop >= productsBoxTop && elTop <= productsBoxBottom) ||
        (elBottom >= productsBoxTop && elBottom <= productsBoxBottom)) {
        return true;
      }
    }
    return false;
  };

  /*
   * Get location in which to put pin on palette
   *
   * @method getPercent
   *
   * @param {Number} len - length of palette palette.scale.colors array
   *
   * @param {Number} Index - Index of color value in
   *  palette.scale.colors array
   *
   * @return {number} Percent of color index in
   *  palette.scale.colors array
   *
   */
  self.getPercent = function (len, index, caseWidth) {
    var segmentWidth;
    var location;
    if (len < 250) {
      segmentWidth = (caseWidth / (len));
      location = ((segmentWidth * index) + (0.5 * segmentWidth));
      return (location / caseWidth);
    } else {
      return (index / len);
    }
  };

  /*
   * Compare old and new arrays to determine which Layers need to be
   * removed
   *
   * @method LayersToRemove
   *
   * @param {Array} oldArray - Array of layers at last pixel point
   *
   * @param {Array} newArray - Array of layers at new pixel point
   *  palette.scale.colors array
   *
   * @return {Array} Array of layers to remove
   *
   */
  self.LayersToRemove = function (oldArray, newArray) {
    return lodashDifference(oldArray, newArray);
  };

  /*
   * Compare old and new arrays to determine which Layers need to be
   * removed
   *
   * @method LayersToRemove
   *
   * @param {Array} coords - Array of coordinate values
   *
   * @param {Object} map - OpenLayers Map Object
   *
   * @return {Void}
   *
   */
  self.newPoint = function (coords, map) {
    self.activeLayers = [];
    map.forEachLayerAtPixel(coords, function (layer, data) {
      var hex;
      var legends;
      var layerId;

      if (!layer.wv) {
        return;
      }
      if (layer.wv.def.palette) {
        layerId = layer.wv.id;
        if (!layerIsInView(layerId)) {
          return;
        }
        legends = models.palettes.getLegends(layerId);
        hex = util.rgbaToHex(data[0], data[1], data[2], data[3]);

        lodashEach(legends, function (legend) {
          if (legend) {
            self.createRunnerFromLegend(legend, hex, layerId);
          }
        });
      }
    });
    self.update();
  };
  /*
   * Update array of current
   * active palettes
   *
   * @method update
   *
   * @return {Void}
   *
   */
  self.update = function () {
    if (self.oldLayers.length) {
      self.updateRunners(self.LayersToRemove(self.oldLayers, self.activeLayers));
    }
    self.oldLayers = self.activeLayers;
  };
  /*
   * Initiates new legend
   *
   * @method newLegend
   *
   * @param {Array} legends - tooltip data
   *
   * @param {String} hex - color
   *
   * @return {Void}
   *
   */
  self.newLegend = function (legends, hex, layerId) {
    self.activeLayers = [layerId];
    $productsBox.addClass('active-lengend');
    self.createRunnerFromLegend(legends, hex, layerId);
    self.update();
  };

  /*
   * Compare old and new arrays to determine which Layers need to be
   * removed
   *
   * @method LayersToRemove
   *
   * @param {Array} coords - Array of coordinate values
   *
   * @param {Object} map - OpenLayers Map Object
   *
   * @return {Void}
   *
   */
  self.createRunnerFromLegend = function (legend, hex, layerId) {
    var paletteInfo;
    if (legend.type === 'continuous' || legend.type === 'discrete') {
      paletteInfo = self.getDataLabel(legend, hex);
      if (paletteInfo) {
        self.setLayerValue(layerId, paletteInfo);
        self.activeLayers.push(layerId);
      }
    } else if (legend.type === 'classification') {
      paletteInfo = self.getDataLabel(legend, hex);
      if (paletteInfo) {
        self.setCategoryValue(layerId, paletteInfo);
        self.activeLayers.push(layerId);
      }
    }
  };

  /*
   * Remove wv-running class from palette case
   *  element
   *
   * @method remove
   *
   * @param {String} id - Pallete id
   *
   * @return {Void}
   *
   */
  self.remove = function (id) {
    var $palette = $('#' + id);
    var $paletteCase = $palette.parent();
    $paletteCase.removeClass('wv-running');
    $palette.removeClass('wv-running');
  };
  self.clearAll = function () {
    $productsBox.removeClass('active-lengend');
    $('.wv-running')
      .removeClass('wv-running');
  };
  /*
   * Add running-data component to palette for
   * category layers
   *
   * @method setCategoryValue
   *
   * @param {String} id - Pallete id
   *
   * @param {Object} data - Object that contains
   *  the index, length and label of running data
   *  value
   *
   * @return {Void}
   *
   */
  self.setCategoryValue = function (id, data) {
    var $categoryPaletteCase;
    var $colorSquare;
    var $paletteLabel;
    var offsetLeft;
    var offsetTop;
    var squareWidth;
    var offset;
    var labelWidth;
    var marginLeft;
    var caseWidth;

    squareWidth = 17;
    marginLeft = 3;

    $categoryPaletteCase = $('#' + id + '_panel.wv-palettes-panel');
    caseWidth = $categoryPaletteCase.width();
    $colorSquare = $categoryPaletteCase.find('[data-class-index=\'' + data.index + '\']');
    offset = $colorSquare.position();
    $paletteLabel = $categoryPaletteCase.find('.wv-running-category-label');

    $paletteLabel.text(data.label);
    labelWidth = util.getTextWidth(data.label, 'Lucida Sans');
    offsetLeft = offset.left + (squareWidth / 2);
    offsetTop = offset.top + squareWidth;
    offsetLeft = self.getLabelMarginLeft(labelWidth, caseWidth, offsetLeft, marginLeft);
    $paletteLabel.attr('style', 'left:' + Math.round(offsetLeft) + 'px; top: ' + offsetTop + 'px');
    $categoryPaletteCase.addClass('wv-running');
    $categoryPaletteCase.find('.wv-active')
      .removeClass('wv-active');
    $colorSquare.addClass('wv-active');
  };

  /*
   * Add running-data component to palette for
   * non-category layers
   *
   * @method setLayerValue
   *
   * @param {String} id - Layer id
   *
   * @param {Object} data - Object that contains
   *  the index, length and label of running data
   *  value
   *
   * @return {Void}
   *
   */
  self.setLayerValue = function (id, data) {
    var $palette;
    var $paletteCase;
    var $paletteWidth;
    var $paletteCaseWidth;
    var $paletteLabel;
    var $paletteBar;
    var labelWidth;
    var percent;
    var labelMargin;
    var offsetLeft;
    var margin;
    var marginLeft;

    marginLeft = 3;

    $palette = $('#' + id + '_panel .wv-palettes-colorbar');
    $paletteCase = $palette.parent().parent();
    $paletteWidth = $palette.width();
    $paletteCaseWidth = $paletteCase.outerWidth();
    $paletteLabel = $paletteCase.find('.wv-running-label');
    $paletteBar = $paletteCase.find('.wv-running-bar');

    percent = self.getPercent(data.len, data.index, $paletteWidth);
    margin = (($paletteCaseWidth - $paletteWidth) / 2);
    offsetLeft = ($paletteWidth * percent + margin);

    $paletteLabel.text(data.label);
    labelWidth = util.getTextWidth(data.label, 'Lucida Sans');
    labelMargin = self.getLabelMarginLeft(labelWidth, $paletteCaseWidth, offsetLeft, marginLeft);

    $paletteLabel.attr('style', 'left:' + Math.round(labelMargin) + 'px;');
    $paletteBar.attr('style', 'left:' + Math.round(offsetLeft) + 'px;');
    $paletteCase.addClass('wv-running');
  };

  /*
   * Loops through and removes running data values from layers
   *
   * @method updateRunners
   *
   * @param {Object} layers - list of layers to remove
   *
   * @return {Void}
   *
   */
  self.updateRunners = function (layers) {
    if (layers.length) {
      for (var i = 0, len = layers.length; i < len; i++) {
        self.remove(layers[i]);
      }
    }
  };
  self.init();
};
