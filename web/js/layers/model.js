import lodashEach from 'lodash/each';
import lodashEachRight from 'lodash/eachRight';
import lodashFilter from 'lodash/filter';
import lodashFind from 'lodash/find';
import lodashFindIndex from 'lodash/findIndex';
import lodashIsUndefined from 'lodash/isUndefined';
import lodashCloneDeep from 'lodash/cloneDeep';
import { getActiveDateString } from '../compare/util';
import util from '../util/util';
const activeGroups = ['active', 'activeA', 'activeB'];
var loaded = false;

export function layersModel(models, config) {
  var self = {};

  var split = 0;
  self.events = util.events();

  self.active = [];
  self.activeA = [];
  self.activeB = [];

  var init = function() {
    self.reset();
  };

  self.reset = function() {
    self.clear();
    if (config.defaults && config.defaults.startingLayers) {
      lodashEach(config.defaults.startingLayers, function(start) {
        lodashEach(activeGroups, activeLayerString => {
          self[activeLayerString] = self.add(
            start.id,
            start,
            activeLayerString
          );
        });
      });
    }
  };

  self.get = function(spec, activeLayers) {
    spec = spec || {};
    activeLayers = activeLayers || self.active;
    var baselayers = forGroup('baselayers', spec, activeLayers);
    var overlays = forGroup('overlays', spec, activeLayers);
    if (spec.group === 'baselayers') {
      return baselayers;
    }
    if (spec.group === 'overlays') {
      return overlays;
    }
    if (spec.group === 'all') {
      return {
        baselayers: baselayers,
        overlays: overlays
      };
    }
    if (spec.group) {
      throw new Error('Invalid layer group: ' + spec.group);
    }
    return baselayers.concat(overlays);
  };

<<<<<<< HEAD
  self.getTitles = function (layerId, proj) {
    try {
      proj = proj || models.proj.selected.id;
      var title, subtitle, tags;
      if (config.layers[layerId].projections[proj]) {
        var forProj = config.layers[layerId].projections[proj];
        title = forProj.title;
        subtitle = forProj.subtitle;
        tags = forProj.tags;
      }
      var forLayer = config.layers[layerId];
      title = title || forLayer.title || '[' + layerId + ']';
      subtitle = subtitle || forLayer.subtitle || '';
      tags = tags || forLayer.tags || '';
      return {
        title: title,
        subtitle: subtitle,
        tags: tags
      };
    } catch (err) {
      throw new Error(`error in layer ${layerId}: ${err}`);
=======
  self.getTitles = function(layerId, proj) {
    proj = proj || models.proj.selected.id;
    var title, subtitle, tags;
    if (config.layers[layerId].projections[proj]) {
      var forProj = config.layers[layerId].projections[proj];
      title = forProj.title;
      subtitle = forProj.subtitle;
      tags = forProj.tags;
>>>>>>> update Date and layer models #986
    }
  };

  self.available = function(id, date, activeLayers) {
    activeLayers = activeLayers || self.active;
    var activeDateString = getActiveDateString(
      models.compare.abIsActive,
      models.compareisCompareA
    );
    date = date || models.date[activeDateString];
    var range = self.dateRange(
      {
        layer: id
      },
      activeLayers
    );
    if (range) {
      if (date < range.start || date > range.end) {
        return false;
      }
    }
    return true;
  };

  // Takes a layer id and returns a true or false value
  // if the layer exists in the active layer list
  self.exists = function(layer, activeLayers) {
    var found = false;
    lodashEach(activeLayers, function(current) {
      if (layer === current.id) {
        found = true;
      }
    });
    return found;
  };

  self.dateRange = function(spec, activeLayers) {
    activeLayers = activeLayers || self.active;
    spec = spec || {};
    var layers = spec.layer
      ? [
        lodashFind(activeLayers, {
          id: spec.layer
        })
      ]
      : activeLayers;
    var ignoreRange =
      config.parameters &&
      (config.parameters.debugGIBS || config.parameters.ignoreDateRange);
    if (ignoreRange) {
      return {
        start: new Date(Date.UTC(1970, 0, 1)),
        end: util.now()
      };
    }
    var min = Number.MAX_VALUE;
    var max = 0;
    var range = false;
    lodashEach(layers, function(def) {
      if (def.startDate) {
        range = true;
        var start = util.parseDateUTC(def.startDate).getTime();
        min = Math.min(min, start);
      }
      // For now, we assume that any layer with an end date is
      // an ongoing product unless it is marked as inactive.
      if (def.inactive && def.endDate) {
        range = true;
        var end = util.parseDateUTC(def.endDate).getTime();
        max = Math.max(max, end);
      } else if (def.endDate) {
        range = true;
        max = util.now().getTime();
      }
      // If there is a start date but no end date, this is a
      // product that is currently being created each day, set
      // the max day to today.
      if (def.startDate && !def.endDate) {
        max = util.now().getTime();
      }
    });
    if (range) {
      if (max === 0) {
        max = util.now().getTime();
      }
      return {
        start: new Date(min),
        end: new Date(max)
      };
    }
  };

  self.add = function(id, spec, activeLayerString) {
    activeLayerString = activeLayerString || 'active';
    if (
      lodashFind(self[activeLayerString], {
        id: id
      })
    ) {
      return self[activeLayerString];
    }
    spec = spec || {};
    var def = lodashCloneDeep(config.layers[id]);
    if (!def) {
      throw new Error('No such layer: ' + id);
    }
    def.visible = true;
    if (!lodashIsUndefined(spec.visible)) {
      def.visible = spec.visible;
    } else if (!lodashIsUndefined(spec.hidden)) {
      def.visible = !spec.hidden;
    }
    def.opacity = lodashIsUndefined(spec.opacity) ? 1.0 : spec.opacity;
    if (def.group === 'overlays') {
      self[activeLayerString].unshift(def);
      split += 1;
    } else {
      self[activeLayerString].splice(split, 0, def);
    }
    self.events.trigger('add', def);
    self.events.trigger('change');
    return self[activeLayerString];
  };

  self.remove = function(id, activeLayerString) {
    activeLayerString = activeLayerString || 'active';
    var index = lodashFindIndex(self[activeLayerString], {
      id: id
    });
    var def = self[activeLayerString][index];
    if (index >= 0) {
      self[activeLayerString].splice(index, 1);
      if (index < split) {
        split -= 1;
      }
      self.events.trigger('remove', def);
      self.events.trigger('change');
    }
  };

  self.replace = function(idOld, idNew, activeLayerString) {
    activeLayerString = activeLayerString || 'active';
    var index = lodashFindIndex(self[activeLayerString], {
      id: idOld
    });
    if (index < 0) {
      return;
    }
    var newDef = config.layers[idNew];
    newDef.visible = true;
    newDef.opacity = 1.0;
    self[activeLayerString][index] = newDef;
    self.events.trigger('update');
    self.events.trigger('change');
  };

  self.clear = function(projId, activeLayerString) {
    activeLayerString = activeLayerString || 'active';
    projId = projId || models.proj.selected.id;
    var defs = self[activeLayerString].slice(0);
    lodashEach(defs, function(def) {
      if (projId && def.projections[projId]) {
        self.remove(def.id, activeLayerString);
      }
    });
  };

  self.pushToBottom = function(id, activeLayersString) {
    activeLayersString = activeLayersString || 'active';
    var oldIndex = lodashFindIndex(self[activeLayersString], {
      id: id
    });
    if (oldIndex < 0) {
      throw new Error('Layer is not active: ' + id);
    }
    var def = self[activeLayersString][oldIndex];
    self[activeLayersString].splice(oldIndex, 1);
    if (def.group === 'baselayers') {
      self[activeLayersString].push(def);
    } else {
      self[activeLayersString].splice(split - 1, 0, def);
    }
    self.events.trigger('update');
    self.events.trigger('change');
  };

  self.moveBefore = function(sourceId, targetId, activeLayersString) {
    activeLayersString = activeLayersString || 'active';
    var sourceIndex = lodashFindIndex(self[activeLayersString], {
      id: sourceId
    });
    if (sourceIndex < 0) {
      throw new Error('Layer is not active: ' + sourceId);
    }
    var sourceDef = self[activeLayersString][sourceIndex];

    var targetIndex = lodashFindIndex(self[activeLayersString], {
      id: targetId
    });
    if (targetIndex < 0) {
      throw new Error('Layer is not active: ' + targetId);
    }

    self[activeLayersString].splice(targetIndex, 0, sourceDef);
    if (sourceIndex > targetIndex) {
      sourceIndex++;
    }
    self[activeLayersString].splice(sourceIndex, 1);
    self.events.trigger('update', sourceDef, targetIndex);
    self.events.trigger('change');
  };

  self.setVisibility = function(id, visible, activeLayersString) {
    activeLayersString = activeLayersString || 'active';
    var def = lodashFind(self[activeLayersString], {
      id: id
    });
    if (def.visible !== visible) {
      let index = lodashFindIndex(self[activeLayersString], {
        id: id
      });
      def.visible = visible;
      self[activeLayersString][index] = def;
      self.events.trigger('visibility', def, visible);
      self.events.trigger('change');
    }
  };
  self.toggleVisibility = function(id, activeLayersString) {
    activeLayersString = activeLayersString || 'active';
    var index = lodashFindIndex(self[activeLayersString], {
      id: id
    });

    var visibility = !self[activeLayersString][index].visible;
    self[activeLayersString][index].visible = visibility;
    self.events.trigger('visibility', id, visibility, activeLayersString);
  };
  self.setOpacity = function(id, opacity, activeLayersString) {
    activeLayersString = activeLayersString || 'active';
    var def = lodashFind(self[activeLayersString], {
      id: id
    });
    if (def.opacity !== opacity) {
      def.opacity = opacity;
      self.events.trigger('opacity', def, opacity);
      self.events.trigger('change');
    }
  };

  self.isRenderable = function(id, activeLayers, date) {
    activeLayers = activeLayers || self.active;
    var def = lodashFind(activeLayers, {
      id: id
    });
    if (!def) {
      return false;
    }
    if (!self.available(id, date, activeLayers)) {
      return false;
    }
    if (!def.visible || def.opacity === 0) {
      return false;
    }
    if (def.group === 'overlays') {
      return true;
    }
    var obscured = false;
    lodashEach(
      self.get(
        {
          group: 'baselayers'
        },
        activeLayers
      ),
      function(otherDef) {
        if (otherDef.id === def.id) {
          return false;
        }
        if (
          otherDef.visible &&
          otherDef.opacity === 1.0 &&
          self.available(otherDef.id, activeLayers)
        ) {
          obscured = true;
          return false;
        }
      }
    );
    return !obscured;
  };

  self.save = function(state) {
    var layers;
    state.l = state.l || [];
    if (config.features.compare) {
      state.l1 = state.l1 || [];
      state.l2 = state.l2 || [];
      layers = [
        {
          state: 'l',
          str: 'active'
        },
        {
          state: 'l1',
          str: 'activeA'
        },
        {
          state: 'l2',
          str: 'activeB'
        }
      ];
    } else {
      layers = [{ state: 'l', active: 'active' }];
    }
    lodashEach(layers, obj => {
      lodashEach(self.get({}, self[obj.str]), function(def) {
        var lstate = lodashFind(state[obj.state], {
          id: def.id
        });
        if (!lstate) {
          lstate = {
            id: def.id
          };
          state[obj.state].push(lstate);
        }
        if (!lstate.attributes) {
          lstate.attributes = [];
        }
        if (!def.visible) {
          lstate.attributes.push({
            id: 'hidden'
          });
        }
        if (def.opacity < 1) {
          lstate.attributes.push({
            id: 'opacity',
            value: def.opacity
          });
        }
      });
    });
  };
  self.load = function(state, errors) {
    if (loaded) return;

    var layers;
    if (config.features.compare) {
      layers = [
        {
          state: 'l',
          active: 'active'
        },
        {
          state: 'l1',
          active: 'activeA'
        },
        {
          state: 'l2',
          active: 'activeB'
        }
      ];
    } else {
      layers = [{ state: 'l', active: 'active' }];
    }
    lodashEach(layers, obj => {
      if (!lodashIsUndefined(state[obj.state])) {
        self.clear(models.proj.selected.id, obj.active);
        lodashEachRight(state[obj.state], function(layerDef) {
          if (!config.layers[layerDef.id]) {
            errors.push({
              message: 'No such layer: ' + layerDef.id
            });
            return;
          }
          var hidden = false;
          var opacity = 1.0;
          lodashEach(layerDef.attributes, function(attr) {
            if (attr.id === 'hidden') {
              hidden = true;
            }
            if (attr.id === 'opacity') {
              opacity = util.clamp(parseFloat(attr.value), 0, 1);
              if (isNaN(opacity)) opacity = 0; // "opacity=0.0" is opacity in URL, resulting in NaN
            }
          });

          self[obj.active] = self.add(
            layerDef.id,
            {
              hidden: hidden,
              opacity: opacity
            },
            obj.active
          );
        });
      }
    });
    loaded = true;
  };
  var forGroup = function(group, spec, activeLayers) {
    spec = spec || {};
    var projId = spec.proj || models.proj.selected.id;
    var results = [];
    var defs = lodashFilter(activeLayers, {
      group: group
    });
    lodashEach(defs, function(def) {
      // Skip if this layer isn't available for the selected projection
      if (!def.projections[projId]) {
        return;
      }
      if (
        spec.dynamic &&
        !['subdaily', 'daily', 'monthly', 'yearly'].includes(def.period)
      ) {
        return;
      }
      if (spec.renderable && !self.isRenderable(def.id, activeLayers)) {
        return;
      }
      if (spec.visible && !def.visible) {
        return;
      }
      results.push(def);
    });
    if (spec.reverse) {
      results = results.reverse();
    }
    return results;
  };

  init();
  return self;
}
