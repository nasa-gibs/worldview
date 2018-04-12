import lodashEach from 'lodash/each';
import lodashEachRight from 'lodash/eachRight';
import lodashFilter from 'lodash/filter';
import lodashFind from 'lodash/find';
import lodashFindIndex from 'lodash/findIndex';
import lodashIsUndefined from 'lodash/isUndefined';
import util from '../util/util';

export function layersModel(models, config) {
  var self = {};

  var split = 0;
  self.events = util.events();

  self.active = [];

  var init = function () {
    self.reset();
  };

  self.reset = function () {
    self.clear();
    if (config.defaults && config.defaults.startingLayers) {
      lodashEach(config.defaults.startingLayers, function (start) {
        self.add(start.id, start);
      });
    }
  };

  self.get = function (spec) {
    spec = spec || {};
    var baselayers = forGroup('baselayers', spec);
    var overlays = forGroup('overlays', spec);
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

  self.getTitles = function (layerId, proj) {
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
  };

  self.available = function (id) {
    var range = self.dateRange({
      layer: id
    });
    var date = models.date.selected;
    if (range) {
      if (date < range.start || date > range.end) {
        return false;
      }
    }
    return true;
  };

  // Takes a layer id and returns a true or false value
  // if the layer exists in the active layer list
  self.exists = function (layer) {
    var found = false;
    lodashEach(self.active, function (current) {
      if (layer === current.id) {
        found = true;
      }
    });
    return found;
  };

  self.dateRange = function (spec) {
    spec = spec || {};
    var projId = spec.projId || models.proj.selected.id;
    var layers = (spec.layer) ? [lodashFind(self.active, {
      id: spec.layer
    })]
      : self.active;
    var ignoreRange =
      config.parameters &&
      (config.parameters.debugGIBS || config.parameters.ignoreDateRange);
    if (ignoreRange) {
      return {
        start: new Date(Date.UTC(1970, 0, 1)),
        end: util.today()
      };
    }
    var min = Number.MAX_VALUE;
    var max = 0;
    var range = false;
    lodashEach(layers, function (def) {
      if (def.startDate) {
        range = true;
        var start = util.parseDateUTC(def.startDate)
          .getTime();
        min = Math.min(min, start);
      }
      // For now, we assume that any layer with an end date is
      // an ongoing product unless it is marked as inactive.
      if (def.inactive && def.endDate) {
        range = true;
        var end = util.parseDateUTC(def.endDate)
          .getTime();
        max = Math.max(max, end);
      } else if (def.endDate) {
        range = true;
        max = util.today()
          .getTime();
      }
      // If there is a start date but no end date, this is a
      // product that is currently being created each day, set
      // the max day to today.
      if (def.startDate && !def.endDate) {
        max = util.today()
          .getTime();
      }
    });
    if (range) {
      if (max === 0) {
        max = util.today()
          .getTime();
      }
      return {
        start: new Date(min),
        end: new Date(max)
      };
    }
  };

  self.add = function (id, spec) {
    if (lodashFind(self.active, {
      id: id
    })) {
      return;
    }
    spec = spec || {};
    var def = config.layers[id];
    if (!def) {
      throw new Error('No such layer: ' + id);
    }
    def.visible = true;
    if (!lodashIsUndefined(spec.visible)) {
      def.visible = spec.visible;
    } else if (!lodashIsUndefined(spec.hidden)) {
      def.visible = !spec.hidden;
    }
    def.opacity = (lodashIsUndefined(spec.opacity)) ? 1.0 : spec.opacity;
    if (def.group === 'overlays') {
      self.active.unshift(def);
      split += 1;
    } else {
      self.active.splice(split, 0, def);
    }
    self.events.trigger('add', def);
    self.events.trigger('change');
  };

  self.remove = function (id) {
    var index = lodashFindIndex(self.active, {
      id: id
    });
    var def = self.active[index];
    if (index >= 0) {
      self.active.splice(index, 1);
      if (index < split) {
        split -= 1;
      }
      self.events.trigger('remove', def);
      self.events.trigger('change');
    }
  };

  self.replace = function (idOld, idNew) {
    var index = lodashFindIndex(self.active, {
      id: idOld
    });
    if (index < 0) {
      return;
    }
    var oldDef = self.active[index];
    var newDef = config.layers[idNew];
    newDef.visible = true;
    newDef.opacity = 1.0;
    self.active[index] = newDef;
    self.events.trigger('update');
    self.events.trigger('change');
  };

  self.clear = function (projId) {
    projId = projId || models.proj.selected.id;
    var defs = self.active.slice(0);
    lodashEach(defs, function (def) {
      if (projId && def.projections[projId]) {
        self.remove(def.id);
      }
    });
  };

  self.pushToBottom = function (id) {
    var oldIndex = lodashFindIndex(self.active, {
      id: id
    });
    if (oldIndex < 0) {
      throw new Error('Layer is not active: ' + id);
    }
    var def = self.active[oldIndex];
    self.active.splice(oldIndex, 1);
    if (def.group === 'baselayers') {
      self.active.push(def);
    } else {
      self.active.splice(split - 1, 0, def);
    }
    self.events.trigger('update');
    self.events.trigger('change');
  };

  self.moveBefore = function (sourceId, targetId) {
    var sourceIndex = lodashFindIndex(self.active, {
      id: sourceId
    });
    if (sourceIndex < 0) {
      throw new Error('Layer is not active: ' + source);
    }
    var sourceDef = self.active[sourceIndex];

    var targetIndex = lodashFindIndex(self.active, {
      id: targetId
    });
    if (targetIndex < 0) {
      throw new Error('Layer is not active: ' + target);
    }

    self.active.splice(targetIndex, 0, sourceDef);
    if (sourceIndex > targetIndex) {
      sourceIndex++;
    }
    self.active.splice(sourceIndex, 1);
    self.events.trigger('update', sourceDef, targetIndex);
    self.events.trigger('change');
  };

  self.setVisibility = function (id, visible) {
    var def = lodashFind(self.active, {
      id: id
    });
    if (def.visible !== visible) {
      def.visible = visible;
      self.events.trigger('visibility', def, visible);
      self.events.trigger('change');
    }
  };

  self.setOpacity = function (id, opacity) {
    var def = lodashFind(self.active, {
      id: id
    });
    if (def.opacity !== opacity) {
      def.opacity = opacity;
      self.events.trigger('opacity', def, opacity);
      self.events.trigger('change');
    }
  };

  self.isRenderable = function (id) {
    var def = lodashFind(self.active, {
      id: id
    });
    if (!def) {
      return false;
    }
    if (!self.available(id)) {
      return false;
    }
    if (!def.visible || def.opacity === 0) {
      return false;
    }
    if (def.group === 'overlays') {
      return true;
    }
    var obscured = false;
    lodashEach(self.get({
      group: 'baselayers'
    }), function (otherDef) {
      if (otherDef.id === def.id) {
        return false;
      }
      if (otherDef.visible && otherDef.opacity === 1.0 &&
        self.available(otherDef.id)) {
        obscured = true;
        return false;
      }
    });
    return !obscured;
  };

  self.save = function (state) {
    var defs = self.get();
    state.l = state.l || [];
    lodashEach(self.get(), function (def) {
      var lstate = lodashFind(state.l, {
        id: def.id
      });
      if (!lstate) {
        lstate = {
          id: def.id
        };
        state.l.push(lstate);
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
  };

  self.load = function (state, errors) {
    if (!lodashIsUndefined(state.l)) {
      self.clear(models.proj.selected.id);
      lodashEachRight(state.l, function (layerDef) {
        if (!config.layers[layerDef.id]) {
          errors.push({
            message: 'No such layer: ' + layerDef.id
          });
          return;
        }
        var hidden = false;
        var opacity = 1.0;
        lodashEach(layerDef.attributes, function (attr) {
          if (attr.id === 'hidden') {
            hidden = true;
          }
          if (attr.id === 'opacity') {
            opacity = util.clamp(parseFloat(attr.value), 0, 1);
            if (isNaN(opacity)) opacity = 0; // "opacity=0.0" is opacity in URL, resulting in NaN
          }
        });
        self.add(layerDef.id, {
          hidden: hidden,
          opacity: opacity
        });
      });
    }
  };

  var forGroup = function (group, spec) {
    spec = spec || {};
    var projId = spec.proj || models.proj.selected.id;
    var results = [];
    var defs = lodashFilter(self.active, {
      group: group
    });
    lodashEach(defs, function (def) {
      // Skip if this layer isn't available for the selected projection
      if (!def.projections[projId]) {
        return;
      }
      if (spec.dynamic && !['subdaily', 'daily', 'monthly', 'yearly'].includes(def.period)) {
        return;
      }
      if (spec.renderable && !self.isRenderable(def.id)) {
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
};
