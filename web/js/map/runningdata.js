import $ from 'jquery';
import util from '../util/util';
import loDifference from 'lodash/difference';
import loEach from 'lodash/each';

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
  self.getLabelMarginLeft = function (labelWidth, caseWidth, location) {
    if (location + (labelWidth / 2) > caseWidth) {
      return (caseWidth - labelWidth) - 5;
    } else if (location - (labelWidth / 2) < 0) {
      return 0;
    } else {
      return (location - ((labelWidth / 2) + 5));
    }
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
   * Gets the point in which to place the running
   * data value label
   *
   * @method getPalette
   *
   * @param {String} id - Palette id
   *
   * @return {Object} Jquery palette dom object
   *
   */
  self.getPalette = function (id) {
    return $(document.getElementById(id));
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
    return loDifference(oldArray, newArray);
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

        loEach(legends, function (legend) {
          if (legend) {
            self.createRunnerFromLegend(legend, hex);
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
  self.newLegend = function (legends, hex) {
    self.activeLayers = [legends.id];
    $productsBox.addClass('active-lengend');
    self.createRunnerFromLegend(legends, hex);
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
  self.createRunnerFromLegend = function (legend, hex) {
    var paletteInfo;

    if (legend.type === 'continuous' || legend.type === 'discrete') {
      paletteInfo = self.getDataLabel(legend, hex);
      if (paletteInfo) {
        self.setLayerValue(legend.id, paletteInfo);
        self.activeLayers.push(legend.id);
      }
    } else if (legend.type === 'classification') {
      paletteInfo = self.getDataLabel(legend, hex);
      if (paletteInfo) {
        self.setCategoryValue(legend.id, paletteInfo);
        self.activeLayers.push(legend.id);
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
    var location;
    var marginLeft;
    var squareWidth;

    marginLeft = 3;
    squareWidth = 15;

    $categoryPaletteCase = $('#' + id);
    $colorSquare = $categoryPaletteCase.find('[data-class-index=\'' + data.index + '\']');
    $paletteLabel = $categoryPaletteCase.find('.wv-running-category-label');

    $paletteLabel.text(data.label);

    location = ((marginLeft + squareWidth) * data.index);
    if (location < 5) {
      location = 5;
    }
    $paletteLabel.attr('style', 'left:' + Math.round(location) + 'px;');
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
   * @param {String} id - Pallete id
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
    var location;
    var margin;

    $palette = self.getPalette(id);
    $paletteCase = $palette.parent();
    $paletteWidth = $palette.width();
    $paletteCaseWidth = $paletteCase.outerWidth();
    $paletteLabel = $paletteCase.find('.wv-running-label');
    $paletteBar = $paletteCase.find('.wv-running-bar');

    percent = self.getPercent(data.len, data.index, $paletteWidth);
    margin = (($paletteCaseWidth - $paletteWidth) / 2);
    location = ($paletteWidth * percent + margin);

    $paletteLabel.text(data.label);
    labelWidth = util.getTextWidth(data.label, 'Lucida Sans');
    labelMargin = self.getLabelMarginLeft(labelWidth, $paletteWidth, location);

    $paletteLabel.attr('style', 'left:' + Math.round(labelMargin) + 'px;');
    $paletteBar.attr('style', 'left:' + Math.round(location) + 'px;');
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
