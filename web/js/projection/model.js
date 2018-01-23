import lodashEach from 'lodash/each';
import olProj from 'ol/proj';
import proj4 from 'proj4';
import util from '../util/util';

export function projectionModel(config) {
  var self = {};
  self.selected = null;
  self.events = util.events();

  var init = function () {
    self.selectDefault();
    olProj.setProj4(proj4);
    lodashEach(config.projections, function (proj) {
      if (proj.crs && proj.proj4) {
        self.register(proj.crs, proj.proj4);
        olProj.get(proj.crs)
          .setExtent(proj.maxExtent);
      }
    });
  };

  self.select = function (id) {
    var proj = config.projections[id];
    if (!proj) {
      throw new Error('Invalid projection: ' + id);
    }
    var updated = false;
    if (!self.selected || self.selected.id !== id) {
      self.selected = proj;
      self.events.trigger('select', proj);
    }
    return updated;
  };

  self.selectDefault = function () {
    if (config.defaults && config.defaults.projection) {
      self.select(config.defaults.projection);
    }
  };

  self.save = function (state) {
    state.p = self.selected.id;
  };

  self.load = function (state) {
    var projId = state.p;
    if (projId) {
      self.select(projId);
    }
  };

  self.register = function (crs, def) {
    if (def && proj4) {
      proj4.defs(crs, def);
    }
  };

  init();
  return self;
};
