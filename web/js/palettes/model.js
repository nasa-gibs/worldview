import lodashEach from 'lodash/each';
import lodashFind from 'lodash/find';
import lodashCloneDeep from 'lodash/cloneDeep';
import lodashIsNaN from 'lodash/isNaN';
import lodashIsUndefined from 'lodash/isUndefined';
import lodashParseInt from 'lodash/parseInt';
import util from '../util/util';
import palettes from './palettes';

export function palettesModel(models, config) {
  config.palettes = config.palettes || {
    rendered: {},
    custom: {}
  };

  var self = {};
  self.events = util.events();
  self.active = {};

  self.getRendered = function (layerId, index) {
    var name = config.layers[layerId].palette.id;
    var palette = config.palettes.rendered[name];
    if (!lodashIsUndefined(index)) {
      palette = palette.maps[index];
    }
    return palette;
  };

  self.getCustom = function (paletteId) {
    var palette = config.palettes.custom[paletteId];
    if (!palette) {
      throw new Error('Invalid palette: ' + paletteId);
    }
    return palette;
  };

  var prepare = function (layerId) {
    self.active[layerId] = self.active[layerId] || {};
    var active = self.active[layerId];
    active.maps = active.maps || [];
    lodashEach(self.getRendered(layerId)
      .maps,
    function (palette, index) {
      if (!active.maps[index]) {
        active.maps[index] = lodashCloneDeep(palette);
      }
    });
  };

  self.allowed = function (layerId) {
    if (!palettes.supported) {
      return false;
    }
    return config.layers[layerId].palette;
  };

  self.setCustom = function (layerId, paletteId, index) {
    if (!config.layers[layerId]) {
      throw new Error('Invalid layer: ' + layerId);
    }
    prepare(layerId);
    index = (lodashIsUndefined(index)) ? 0 : index;
    var active = self.active[layerId];
    var palette = active.maps[index];
    if (palette.custom === paletteId) {
      return;
    }
    palette.custom = paletteId;
    updateLookup(layerId);
    self.events.trigger('set-custom', layerId, active);
    self.events.trigger('change');
  };

  self.clearCustom = function (layerId, index) {
    index = (lodashIsUndefined(index)) ? 0 : index;
    var active = self.active[layerId];
    if (!active) {
      return;
    }
    var palette = active.maps[index];
    if (!palette.custom) {
      return;
    }
    delete palette.custom;
    updateLookup(layerId);
    self.events.trigger('clear-custom', layerId);
    self.events.trigger('change');
  };

  self.setRange = function (layerId, min, max, squash, index) {
    prepare(layerId);
    index = (lodashIsUndefined(index)) ? 0 : index;
    var palette = self.active[layerId].maps[index];
    if (min === 0) {
      min = undefined;
    }
    if (max === self.get(layerId, index)
      .entries.values.length - 1) {
      max = undefined;
    }
    palette.min = min;
    palette.max = max;
    palette.squash = squash;
    updateLookup(layerId);
    self.events.trigger('range', layerId, palette.min, palette.max);
    self.events.trigger('change');
  };

  self.getCount = function (layerId) {
    return self.getRendered(layerId)
      .maps.length;
  };
  /**
   * Gets a single colormap (entries / legend combo)
   *
   *
   * @method get
   * @static
   * @param str {string} The ID of the layer
   * @param number {Number} The index of the colormap for this layer, default 0
   * object.
   * @return {object} object including the entries and legend
   */
  self.get = function (layerId, index) {
    index = (lodashIsUndefined(index)) ? 0 : index;
    if (self.active[layerId]) {
      return self.active[layerId].maps[index];
    }
    return self.getRendered(layerId, index);
  };
  /**
   * Gets the legend of a colormap
   *
   *
   * @method getLegend
   * @static
   * @param str {string} The ID of the layer
   * @param number {Number} The index of the colormap for this layer, default 0
   * object.
   * @return {object} object of the legend
   */
  self.getLegend = function (layerId, index) {
    var value = self.get(layerId, index);
    return value.legend || value.entries;
  };
  /**
   * Gets the legend of a colormap
   *
   *
   * @method getDefaultLegend
   * @static
   * @param str {string} The ID of the layer
   * @param number {Number} The index of the colormap for this layer, default 0
   * object.
   * @return {object} object of the legend
   */
  self.getDefaultLegend = function (layerId, index) {
    var palette = self.getRendered(layerId, index);
    return palette.legend || palette.entries;
  };

  self.getLegends = function (layerId) {
    var legends = [];
    var count = self.getCount(layerId);
    for (var i = 0; i < count; i++) {
      legends.push(self.getLegend(layerId, i));
    }
    return legends;
  };

  // Is a canvas required?
  self.isActive = function (layerId) {
    return self.active[layerId];
  };

  // Looks up options/colormaps/layer.xml colormap entry
  self.getLookup = function (layerId) {
    return self.active[layerId].lookup;
  };

  self.clear = function () {
    self.active = {};
    self.events.trigger('update');
  };

  self.restore = function (active) {
    self.active = active;
    self.events.trigger('update');
  };

  var getMinValue = function (v) {
    return (v.length) ? v[0] : v;
  };

  var getMaxValue = function (v) {
    return (v.length) ? v[v.length - 1] : v;
  };

  self.save = function (state) {
    if (self.inUse() && !state.l) {
      throw new Error('No layers in state');
    }
    lodashEach(self.active, function (def, layerId) {
      if (!lodashFind(models.layers.get(), {
        id: layerId
      })) {
        return;
      }
      if (self.getCount(layerId) > 1) {
        self.saveMulti(state, layerId);
      } else {
        self.saveSingle(state, layerId);
      }
    });
  };

  self.saveSingle = function (state, layerId) {
    var attr = lodashFind(state.l, {
      id: layerId
    })
      .attributes;
    var def = self.get(layerId);
    if (def.custom) {
      attr.push({
        id: 'palette',
        value: def.custom
      });
    }
    if (def.min) {
      var minValue = def.entries.values[def.min];
      attr.push({
        id: 'min',
        value: minValue
      });
    }
    if (def.max) {
      var maxValue = def.entries.values[def.max];
      attr.push({
        id: 'max',
        value: maxValue
      });
    }
    if (def.squash) {
      attr.push({
        id: 'squash'
      });
    }
  };

  self.saveMulti = function (state, layerId) {
    var palettes = [];
    var hasPalettes = false;
    var min = [];
    var hasMin = false;
    var max = [];
    var hasMax = false;
    var squash = [];
    var hasSquash = false;

    for (var i = 0; i < self.getCount(layerId); i++) {
      var def = self.get(layerId, i);
      if (def.custom) {
        palettes.push(def.custom);
        hasPalettes = true;
      } else {
        palettes.push('');
      }

      if (def.min) {
        min.push(getMinValue(def.entries.values[def.min]));
        hasMin = true;
      } else {
        min.push('');
      }

      if (def.max) {
        max.push(getMaxValue(def.entries.values[def.max]));
        hasMax = true;
      } else {
        max.push('');
      }

      if (def.squash) {
        squash.push(def.squash);
        hasSquash = true;
      } else {
        squash.push('');
      }
    }

    var attr = lodashFind(state.l, {
      id: layerId
    })
      .attributes;
    if (hasPalettes) {
      attr.push({
        id: 'palette',
        value: palettes.join(';')
      });
    }
    if (hasMin) {
      attr.push({
        id: 'min',
        value: min.join(';')
      });
    }
    if (hasMax) {
      attr.push({
        id: 'max',
        value: max.join(';')
      });
    }
    if (hasSquash) {
      attr.push({
        id: 'squash',
        value: squash.join(';')
      });
    }
  };

  self.key = function (layerId) {
    if (!self.isActive(layerId)) {
      return '';
    }
    var def = self.get(layerId);
    var keys = [];
    if (def.custom) {
      keys.push('palette=' + def.custom);
    }
    if (def.min) {
      keys.push('min=' + def.min);
    }
    if (def.max) {
      keys.push('max=' + def.max);
    }
    if (def.squash) {
      keys.push('squash');
    }
    return keys.join(',');
  };

  self.load = function (state, errors) {
    if (!palettes.supported) {
      return;
    }

    lodashEach(state.l, function (layerDef) {
      var layerId = layerDef.id;
      var minValue, maxValue;
      var min = [];
      var max = [];
      var squash = [];
      var count = 0;
      lodashEach(layerDef.attributes, function (attr) {
        var values;
        if (attr.id === 'palette') {
          count = self.getCount(layerId);
          values = util.toArray(attr.value.split(';'));
          lodashEach(values, function (value, index) {
            try {
              self.setCustom(layerId, value, index);
            } catch (error) {
              errors.push('Invalid palette: ' + value);
            }
          });
        }
        if (attr.id === 'min') {
          count = self.getCount(layerId);
          values = util.toArray(attr.value.split(';'));
          lodashEach(values, function (value, index) {
            if (value === '') {
              min.push(undefined);
              return;
            }
            minValue = parseFloat(value);
            if (lodashIsNaN(minValue)) {
              errors.push('Invalid min value: ' + value);
            } else {
              min.push(findIndex(layerId, 'min', minValue, index));
            }
          });
        }
        if (attr.id === 'max') {
          count = self.getCount(layerId);
          values = util.toArray(attr.value.split(';'));
          lodashEach(values, function (value, index) {
            if (value === '') {
              max.push(undefined);
              return;
            }
            maxValue = parseFloat(value);
            if (lodashIsNaN(maxValue)) {
              errors.push('Invalid max value: ' + value);
            } else {
              max.push(findIndex(layerId, 'max', maxValue, index));
            }
          });
        }
        if (attr.id === 'squash') {
          count = self.getCount(layerId);
          if (attr.value === true) {
            squash[0] = true;
          } else {
            values = util.toArray(attr.value.split(';'));
            lodashEach(values, function (value) {
              squash.push(value === 'true');
            });
          }
        }
      });
      if (min.length > 0 || max.length > 0) {
        for (var i = 0; i < count; i++) {
          var vmin = (min.length > 0) ? min[i] : undefined;
          var vmax = (max.length > 0) ? max[i] : undefined;
          var vsquash = (squash.length > 0) ? squash[i] : undefined;
          self.setRange(layerId, vmin, vmax, vsquash, i);
        }
      }
    });
  };

  var findIndex = function (layerId, type, value, index) {
    index = index || 0;
    var values = self.get(layerId, index)
      .entries.values;
    var result;
    lodashEach(values, function (check, index) {
      var min = getMinValue(check);
      var max = getMaxValue(check);
      if (type === 'min' && value === min) {
        result = index;
        return false;
      }
      if (type === 'max' && value === max) {
        result = index;
        return false;
      }
    });
    return result;
  };

  // If any custom rendering is being used, image download must turn it
  // off
  self.inUse = function () {
    var layers = models.layers.get();
    var found = false;
    lodashEach(layers, function (layer) {
      if (self.active[layer.id]) {
        found = true;
        return false;
      }
    });
    return found;
  };

  var useLookup = function (layerId) {
    var use = false;
    var active = self.active[layerId].maps;

    lodashEach(active, function (palette, index) {
      if (palette.custom) {
        use = true;
        return false;
      }
      var rendered = self.getRendered(layerId, index);
      if (palette.type !== 'classification') {
        if (palette.min <= 0) {
          delete palette.min;
        }
        if (palette.max >= rendered.entries.values.length) {
          delete palette.max;
        }
        if (!lodashIsUndefined(palette.min) || !lodashIsUndefined(palette.max)) {
          use = true;
          return false;
        }
      }
    });
    return use;
  };

  var updateLookup = function (layerId) {
    if (!useLookup(layerId)) {
      delete self.active[layerId];
      return;
    }
    var lookup = {};
    var active = self.active[layerId].maps;
    lodashEach(active, function (palette, index) {
      var oldLegend = palette.legend;
      var entries = palette.entries;
      var legend = {
        colors: [],
        minLabel: oldLegend.minLabel,
        maxLabel: oldLegend.maxLabel,
        tooltips: oldLegend.tooltips,
        units: oldLegend.units,
        type: entries.type,
        title: entries.title,
        id: oldLegend.id
      };
      var source = entries.colors;
      var target = (palette.custom)
        ? self.getCustom(palette.custom)
          .colors : source;

      var min = palette.min || 0;
      var max = palette.max || source.length;

      var sourceCount = source.length;
      var targetCount = target.length;

      lodashEach(source, function (color, index) {
        var targetColor;
        if (index < min || index > max) {
          targetColor = '00000000';
        } else {
          var sourcePercent, targetIndex;
          if (palette.squash) {
            sourcePercent = (index - min) / (max - min);
            if (index === max) {
              sourcePercent = 1.0;
            }
            targetIndex = Math.floor(sourcePercent * targetCount);
            if (targetIndex >= targetCount) {
              targetIndex = targetCount - 1;
            }
          } else {
            sourcePercent = index / sourceCount;
            targetIndex = Math.floor(sourcePercent * targetCount);
          }
          targetColor = target[targetIndex];
        }
        legend.colors.push(targetColor);
        var lookupSource =
          lodashParseInt(color.substring(0, 2), 16) + ',' +
          lodashParseInt(color.substring(2, 4), 16) + ',' +
          lodashParseInt(color.substring(4, 6), 16) + ',' +
          lodashParseInt(color.substring(6, 8), 16);
        var lookupTarget = {
          r: lodashParseInt(targetColor.substring(0, 2), 16),
          g: lodashParseInt(targetColor.substring(2, 4), 16),
          b: lodashParseInt(targetColor.substring(4, 6), 16),
          a: lodashParseInt(targetColor.substring(6, 8), 16)
        };
        lookup[lookupSource] = lookupTarget;
      });
      palette.legend = legend;
    });
    self.active[layerId].lookup = lookup;
  };

  return self;
};
