import $ from 'jquery';
import lodashEach from 'lodash/each';
import lodashFind from 'lodash/find';
import util from '../util/util';
import wvui from '../ui/ui';

export default (function (self) {
  var checkerboard;

  self.supported = true;

  var init = function () {
    var browser = util.browser;
    if (browser.ie || !browser.webWorkers || !browser.cors) {
      self.supported = false;
    } else {
      drawCheckerboard();
    }
  };

  self.colorbar = function (target, colors) {
    var canvas;
    if (target.length) {
      canvas = $(target)
        .get(0);
    } else {
      canvas = target;
    }
    if (!canvas) {
      return;
    }
    var g = canvas.getContext('2d');

    g.fillStyle = checkerboard;
    g.fillRect(0, 0, canvas.width, canvas.height);
    if (colors) {
      var bins = colors.length;
      var binWidth = canvas.width / bins;
      var drawWidth = Math.ceil(binWidth);
      lodashEach(colors, function (color, i) {
        g.fillStyle = util.hexToRGBA(color);
        g.fillRect(Math.floor(binWidth * i), 0, drawWidth,
          canvas.height);
      });
    }
  };

  var drawCheckerboard = function () {
    var size = 2;
    var canvas = document.createElement('canvas');

    canvas.width = size * 2;
    canvas.height = size * 2;

    var g = canvas.getContext('2d');

    // g.fillStyle = "rgb(102, 102, 102)";
    g.fillStyle = 'rgb(200, 200, 200)';
    g.fillRect(0, 0, size, size);
    g.fillRect(size, size, size, size);

    // g.fillStyle = "rgb(153, 153, 153)";
    g.fillStyle = 'rgb(240, 240, 240)';
    g.fillRect(0, size, size, size);
    g.fillRect(size, 0, size, size);

    checkerboard = g.createPattern(canvas, 'repeat');
  };

  self.translate = function (source, target) {
    var translation = [];
    lodashEach(source, function (color, index) {
      var sourcePercent = index / source.length;
      var targetIndex = Math.floor(sourcePercent * target.length);
      translation.push(target[targetIndex]);
    });
    return translation;
  };

  self.lookup = function (sourcePalette, targetPalette) {
    var lookup = {};
    lodashEach(sourcePalette.colors, function (sourceColor, index) {
      var source =
        parseInt(sourceColor.substring(0, 2), 16) + ',' +
        parseInt(sourceColor.substring(2, 4), 16) + ',' +
        parseInt(sourceColor.substring(4, 6), 16) + ',' +
        '255';
      var targetColor = targetPalette.colors[index];
      var target = {
        r: parseInt(targetColor.substring(0, 2), 16),
        g: parseInt(targetColor.substring(2, 4), 16),
        b: parseInt(targetColor.substring(4, 6), 16),
        a: 255
      };
      lookup[source] = target;
    });
    return lookup;
  };

  self.loadCustom = function (config) {
    return util.load.config(config.palettes,
      'custom', 'config/palettes-custom.json');
  };

  self.loadRendered = function (config, layerId) {
    var layer = config.layers[layerId];
    return util.load.config(config.palettes.rendered,
      layer.palette.id, 'config/palettes/' + layer.palette.id + '.json');
  };

  self.requirements = function (state, config) {
    var promises = [];
    config.palettes = {
      rendered: {},
      custom: {}
    };
    lodashEach(state.l, function (qsLayer) {
      var layerId = qsLayer.id;
      if (config.layers[layerId] && config.layers[layerId].palette) {
        promises.push(self.loadRendered(config, layerId));
      }
      var custom = lodashFind(qsLayer.attributes, {
        id: 'palette'
      });
      if (custom) {
        promises.push(self.loadCustom(config));
      }
    });
    if (promises.length > 0) {
      var promise = $.Deferred();
      $.when.apply(null, promises)
        .then(promise.resolve)
        .fail(promise.reject);
      return promise;
    }
  };

  // Only for permalink 1.1 support
  self.parse = function (state, errors, config) {
    if (state.palettes) {
      if (!self.supported) {
        // FIXME: This should go in errors
        delete state.palettes;
        wvui.notify('The custom palette feature is not supported ' +
          'with your web browser. Upgrade or try again in a ' +
          'different browser');
        return;
      }
      var parts = state.palettes.split('~');
      lodashEach(parts, function (part) {
        var items = part.split(',');
        var layerId = items[0];
        var paletteId = items[1];
        if (!config.layers[layerId]) {
          errors.push({
            message: 'Invalid layer for palette ' +
              paletteId + ': ' + layerId
          });
        } else if (!config.layers[layerId].palette) {
          errors.push({
            message: 'Layer ' + layerId + ' does not ' +
              'support palettes'
          });
        } else {
          var layer = lodashFind(state.l, {
            id: layerId
          });
          if (layer) {
            layer.attributes.push({
              id: 'palette',
              value: paletteId
            });
          } else {
            errors.push({
              message: 'Layer ' + layerId + ' is not ' +
                'active'
            });
          }
        }
      });
      delete state.paletes;
    }
  };

  init();
  return self;
})({});
