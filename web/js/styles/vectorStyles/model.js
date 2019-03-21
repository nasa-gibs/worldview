import lodashEach from 'lodash/each';
import lodashFind from 'lodash/find';
import lodashCloneDeep from 'lodash/cloneDeep';
import lodashIsNaN from 'lodash/isNaN';
import lodashIsUndefined from 'lodash/isUndefined';
import lodashParseInt from 'lodash/parseInt';
import util from '../../util/util';
import styles from '../styles';
import Promise from 'bluebird';

export function vectorStylesModel(models, config) {
  config.vectorStyles = config.vectorStyles || {
    rendered: {},
    custom: {}
  };

  var self = {};
  self.events = util.events();
  self.active = {};
  self.activeB = {};

  self.getRenderedVectorStyle = function(layerId, index) {
    var name = config.layers[layerId].vectorStyle.id;
    var vectorStyle = config.vectorStyles.rendered[name];
    if (!lodashIsUndefined(index)) {
      if (vectorStyle.maps) {
        vectorStyle = vectorStyle.maps[index];
      }
    }
    return vectorStyle;
  };

  self.getCustomVectorStyle = function(vectorStyleId) {
    var vectorStyle = config.vectorStyles.custom[vectorStyleId];
    if (!vectorStyle) {
      throw new Error('Invalid vectorStyle: ' + vectorStyleId);
    }
    return vectorStyle;
  };

  var prepare = function(layerId, groupStr) {
    groupStr = groupStr || models.layers.activeLayers;
    self[groupStr][layerId] = self[groupStr][layerId] || {};
    var active = self[groupStr][layerId];
    active.maps = active.maps || [];
    lodashEach(self.getRenderedVectorStyle(layerId).maps, function(vectorStyle, index) {
      if (!active.maps[index]) {
        active.maps[index] = lodashCloneDeep(vectorStyle);
      }
    });
  };

  self.allowed = function(layerId) {
    let vectorStyle = config.layers[layerId].vectorStyle;
    if (!vectorStyle || vectorStyle.immutable) {
      return false;
    }
    return config.layers[layerId].vectorStyle;
  };

  self.setCustom = function(layerId, vectorStyleId, index, groupStr) {
    groupStr = groupStr || models.layers.activeLayers;
    if (!config.layers[layerId]) {
      throw new Error('Invalid layer: ' + layerId);
    }
    prepare(layerId, groupStr);
    index = lodashIsUndefined(index) ? 0 : index;
    var active = self[groupStr][layerId];
    var vectorStyle = active.maps[index];
    if (vectorStyle.custom === vectorStyleId) {
      return;
    }
    vectorStyle.custom = vectorStyleId;
    updateLookup(layerId, groupStr);
    self.events.trigger('set-custom', layerId, active, groupStr);
    self.events.trigger('change');
  };

  self.clearCustom = function(layerId, index, groupStr) {
    groupStr = groupStr || models.layers.activeLayers;
    index = lodashIsUndefined(index) ? 0 : index;
    var active = self[groupStr][layerId];
    if (!active) {
      return;
    }
    var vectorStyle = active.maps[index];
    if (!vectorStyle.custom) {
      return;
    }
    delete vectorStyle.custom;
    updateLookup(layerId, groupStr);
    self.events.trigger('clear-custom', layerId, groupStr);
    self.events.trigger('change');
  };

  self.setRange = function(layerId, min, max, squash, index, groupStr) {
    groupStr = groupStr || models.layers.activeLayers;
    prepare(layerId);
    index = lodashIsUndefined(index) ? 0 : index;
    var vectorStyle = self[groupStr][layerId].maps[index];
    if (min === 0) {
      min = undefined;
    }
    const legend = self.get(layerId, index, groupStr);
    if (legend.entries && legend.entries.values && max === legend.entries.values.length - 1) {
      max = undefined;
    }
    vectorStyle.min = min;
    vectorStyle.max = max;
    vectorStyle.squash = squash;
    updateLookup(layerId, groupStr);
    self.events.trigger('range', layerId, vectorStyle.min, vectorStyle.max, groupStr);
    self.events.trigger('change');
  };

  self.getCount = function(layerId) {
    if (self.getRenderedVectorStyle(layerId).maps) {
      return self.getRenderedVectorStyle(layerId).maps.length;
    } else {
      return 0;
    }
  };

  /**
   * Gets a single colormap (entries / legend combo)
   *
   * @method get
   * @static
   * @param str {string} The ID of the layer
   * @param number {Number} The index of the colormap for this layer, default 0
   * object.
   * @return {object} object including the entries and legend
   */
  self.get = function(layerId, index, groupStr) {
    groupStr = groupStr || models.layers.activeLayers;
    index = lodashIsUndefined(index) ? 0 : index;
    if (self[groupStr][layerId]) {
      return self[groupStr][layerId].maps[index];
    }
    return self.getRenderedVectorStyle(layerId, index);
  };

  /**
   * Gets the legend of a colormap
   *
   * @method getLegend
   * @static
   * @param str {string} The ID of the layer
   * @param number {Number} The index of the colormap for this layer, default 0
   * object.
   * @return {object} object of the legend
   */
  self.getLegend = function(layerId, index, groupStr) {
    groupStr = groupStr || models.layers.activeLayers;
    var value = self.get(layerId, index, groupStr);
    return value.legend || value.entries;
  };

  /**
   * Gets the legend of a colormap
   *
   * @method getDefaultLegend
   * @static
   * @param str {string} The ID of the layer
   * @param number {Number} The index of the colormap for this layer, default 0
   * object.
   * @return {object} object of the legend
   */
  self.getDefaultLegend = function(layerId, index) {
    var vectorStyle = self.getRenderedVectorStyle(layerId, index);
    return vectorStyle.legend || vectorStyle.entries;
  };

  self.getLegends = function(layerId, groupStr) {
    groupStr = groupStr || models.layers.activeLayers;
    var legends = [];
    var count = self.getCount(layerId);
    for (var i = 0; i < count; i++) {
      legends.push(self.getLegend(layerId, i, groupStr));
    }
    return legends;
  };

  // Is a canvas required?
  self.isActive = function(layerId, group) {
    group = group || models.layers.activeLayers;
    return self[group][layerId];
  };

  // Looks up options/colormaps/layer.xml colormap entry
  self.getLookup = function(layerId, groupstr) {
    groupstr = groupstr || models.layers.activeLayers;
    return self[groupstr][layerId].lookup;
  };

  self.clear = function() {
    self.active = {};
    self.events.trigger('update');
  };

  self.restore = function(active) {
    self.active = active;
    self.events.trigger('update');
  };

  var getMinValue = function(v) {
    return v.length ? v[0] : v;
  };

  var getMaxValue = function(v) {
    return v.length ? v[v.length - 1] : v;
  };

  self.save = function(state) {
    var groupArray = [models.layers.activeLayers];
    if (self.inUse() && !state.l) {
      throw new Error('No layers in state');
    }
    if (models.compare && models.compare.active) {
      groupArray = ['active', 'activeB'];
    }
    lodashEach(groupArray, groupStr => {
      lodashEach(self[groupStr], function(def, layerId) {
        if (
          !lodashFind(models.layers.get({}, models.layers[groupStr]), {
            id: layerId
          })
        ) {
          return;
        }
        if (self.getCount(layerId) > 1) {
          self.saveMulti(state, layerId, groupStr);
        } else {
          self.saveSingle(state, layerId, groupStr);
        }
      });
    });
  };
  self.vectorStylePromise = function(layerId, vectorStyleId) {
    return new Promise((resolve, reject) => {
      if (config.vectorStyles.rendered[vectorStyleId]) {
        resolve();
      } else {
        styles.loadRenderedVectorStyle(config, layerId).done(function(result) {
          resolve(result);
        });
      }
    });
  };
  self.saveSingle = function(state, layerId, groupStr) {
    groupStr = groupStr || models.layers.activeLayers;
    var stateStr = 'l';
    if (groupStr === 'activeB' && models.compare && models.compare.active) stateStr = 'l1';
    var attr = lodashFind(state[stateStr], {
      id: layerId
    }).attributes;
    var def = self.get(layerId, undefined, groupStr);
    if (def.custom) {
      attr.push({
        id: 'vectorStyle',
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

  self.saveMulti = function(state, layerId, groupStr) {
    groupStr = groupStr || models.layers.activeLayers;
    var stateStr = 'l';
    var vectorStyles = [];
    var hasVectorStyles = false;
    var min = [];
    var hasMin = false;
    var max = [];
    var hasMax = false;
    var squash = [];
    var hasSquash = false;
    if (groupStr === 'activeB' && models.compare && models.compare.active) stateStr = 'l1';

    for (var i = 0; i < self.getCount(layerId); i++) {
      var def = self.get(layerId, i, groupStr);
      if (def.custom) {
        vectorStyles.push(def.custom);
        hasVectorStyles = true;
      } else {
        vectorStyles.push('');
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

    var attr = lodashFind(state[stateStr], {
      id: layerId
    }).attributes;
    if (hasVectorStyles) {
      attr.push({
        id: 'vectorStyle',
        value: vectorStyles.join(';')
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

  self.key = function(layerId, groupStr) {
    groupStr = groupStr || models.layers.activeLayers;
    if (!self.isActive(layerId, groupStr)) {
      return '';
    }
    var def = self.get(layerId, undefined, groupStr);
    var keys = [];
    if (def.custom) {
      keys.push('vectorStyle=' + def.custom);
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

  self.load = function(state, errors) {
    var stateArray = [{ stateStr: 'l', groupStr: 'active' }];
    if (state.l1) {
      stateArray = [
        { stateStr: 'l', groupStr: 'active' },
        { stateStr: 'l1', groupStr: 'activeB' }
      ];
    }
    lodashEach(stateArray, stateObj => {
      lodashEach(state[stateObj.stateStr], function(layerDef) {
        var layerId = layerDef.id;
        var minValue, maxValue;
        var min = [];
        var max = [];
        var squash = [];
        var count = 0;
        lodashEach(layerDef.attributes, function(attr) {
          var values;
          if (attr.id === 'vectorStyle') {
            count = self.getCount(layerId);
            values = util.toArray(attr.value.split(';'));
            lodashEach(values, function(value, index) {
              try {
                self.setCustom(layerId, value, index, stateObj.groupStr);
              } catch (error) {
                errors.push('Invalid vectorStyle: ' + value);
              }
            });
          }
          if (attr.id === 'min') {
            count = self.getCount(layerId);
            values = util.toArray(attr.value.split(';'));
            lodashEach(values, function(value, index) {
              if (value === '') {
                min.push(undefined);
                return;
              }
              minValue = parseFloat(value);
              if (lodashIsNaN(minValue)) {
                errors.push('Invalid min value: ' + value);
              } else {
                min.push(
                  findIndex(layerId, 'min', minValue, index, stateObj.groupStr)
                );
              }
            });
          }
          if (attr.id === 'max') {
            count = self.getCount(layerId);
            values = util.toArray(attr.value.split(';'));
            lodashEach(values, function(value, index) {
              if (value === '') {
                max.push(undefined);
                return;
              }
              maxValue = parseFloat(value);
              if (lodashIsNaN(maxValue)) {
                errors.push('Invalid max value: ' + value);
              } else {
                max.push(
                  findIndex(layerId, 'max', maxValue, index, stateObj.groupStr)
                );
              }
            });
          }
          if (attr.id === 'squash') {
            count = self.getCount(layerId);
            if (attr.value === true) {
              squash[0] = true;
            } else {
              values = util.toArray(attr.value.split(';'));
              lodashEach(values, function(value) {
                squash.push(value === 'true');
              });
            }
          }
        });
        if (min.length > 0 || max.length > 0) {
          for (var i = 0; i < count; i++) {
            var vmin = min.length > 0 ? min[i] : undefined;
            var vmax = max.length > 0 ? max[i] : undefined;
            var vsquash = squash.length > 0 ? squash[i] : undefined;
            self.setRange(layerId, vmin, vmax, vsquash, i, stateObj.groupStr);
          }
        }
      });
    });
  };

  var findIndex = function(layerId, type, value, index, groupStr) {
    groupStr = groupStr || models.layers.activeLayers;
    index = index || 0;
    var values = self.get(layerId, index, groupStr).entries.values;
    var result;
    lodashEach(values, function(check, index) {
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
  self.inUse = function(groupStr) {
    groupStr = groupStr || models.layers.activeLayers;
    var layers = models.layers.get({}, models.layers[groupStr]);
    var found = false;
    lodashEach(layers, function(layer) {
      if (self[groupStr][layer.id]) {
        found = true;
        return false;
      }
    });
    return found;
  };

  var useLookup = function(layerId, groupStr) {
    groupStr = groupStr || models.layers.activeLayers;
    var use = false;
    var active = self[groupStr][layerId].maps;

    lodashEach(active, function(vectorStyle, index) {
      if (vectorStyle.custom) {
        use = true;
        return false;
      }
      var rendered = self.getRenderedVectorStyle(layerId, index);
      if (vectorStyle.type !== 'classification') {
        if (vectorStyle.min <= 0) {
          delete vectorStyle.min;
        }
        if (vectorStyle.max >= rendered.entries.values.length) {
          delete vectorStyle.max;
        }
        if (
          !lodashIsUndefined(vectorStyle.min) ||
          !lodashIsUndefined(vectorStyle.max)
        ) {
          use = true;
          return false;
        }
      }
    });
    return use;
  };

  var updateLookup = function(layerId, groupStr) {
    groupStr = groupStr || models.layers.activeLayers;
    if (!useLookup(layerId, groupStr)) {
      delete self[groupStr][layerId];
      return;
    }
    var lookup = {};
    var active = self[groupStr][layerId].maps;
    lodashEach(active, function(vectorStyle, index) {
      var oldLegend = vectorStyle.legend;
      var entries = vectorStyle.entries;
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
      var target = vectorStyle.custom
        ? self.getCustomVectorStyle(vectorStyle.custom).colors
        : source;

      var min = vectorStyle.min || 0;
      var max = vectorStyle.max || source.length;

      var sourceCount = source.length;
      var targetCount = target.length;

      lodashEach(source, function(color, index) {
        var targetColor;
        if (index < min || index > max) {
          targetColor = '00000000';
        } else {
          var sourcePercent, targetIndex;
          if (vectorStyle.squash) {
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
          lodashParseInt(color.substring(0, 2), 16) +
          ',' +
          lodashParseInt(color.substring(2, 4), 16) +
          ',' +
          lodashParseInt(color.substring(4, 6), 16) +
          ',' +
          lodashParseInt(color.substring(6, 8), 16);
        var lookupTarget = {
          r: lodashParseInt(targetColor.substring(0, 2), 16),
          g: lodashParseInt(targetColor.substring(2, 4), 16),
          b: lodashParseInt(targetColor.substring(4, 6), 16),
          a: lodashParseInt(targetColor.substring(6, 8), 16)
        };
        lookup[lookupSource] = lookupTarget;
      });
      vectorStyle.legend = legend;
    });
    self[groupStr][layerId].lookup = lookup;
  };

  return self;
}
