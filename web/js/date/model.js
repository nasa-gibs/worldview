import lodashEach from 'lodash/each';
import lodashFind from 'lodash/find';
import util from '../util/util';

export function dateModel(models, config, spec) {
  spec = spec || {};

  var self = {};
  self.events = util.events();
  self.selected = null;

  self.monthAbbr = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  var init = function () {
    var initial = spec.initial || util.now();
    self.select(initial);
  };

  self.string = function () {
    return util.toISOStringDate(self.selected);
  };

  self.select = function (date) {
    date = self.clamp(date);
    var updated = false;
    if (!self.selected || date.getTime() !== self.selected.getTime()) {
      self.selected = date;
      self.events.trigger('select', date);
      updated = true;
    }
    return updated;
  };

  self.add = function (interval, amount) {
    self.select(util.dateAdd(self.selected, interval, amount));
  };

  self.clamp = function (date) {
    var endDate = self.lastDate(spec);
    if (self.maxZoom > 3) {
      if (date > util.now()) {
        date = util.now();
      }
    } else {
      if (date > endDate) {
        date = endDate;
      }
    }
    if (config.startDate) {
      let startDate = util.parseDateUTC(config.startDate);
      if (date < startDate) {
        date = startDate;
      }
    }
    return date;
  };

  self.dateRange = function (spec) {
    spec = spec || {};
    var layers = (spec.layer) ? [lodashFind(models.layers.active, {
      id: spec.layer
    })]
      : models.layers.active;
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
        let end = util.parseDateUTC(def.endDate)
          .getTime();
        max = Math.max(max, end);
      } else if (def.endDate) {
        range = true;
        let end = util.parseDateUTC(def.endDate)
          .getTime();
        let today = util.today()
          .getTime();
        if (end > today) {
          max = Math.max(max, end);
        } else {
          max = Math.max(max, today);
        }
      }
      // If there is a start date but no end date, this is a
      // product that is currently being created each day, set
      // the max day to today.
      if (def.startDate && !def.endDate) {
        max = util.now()
          .getTime();
      }
    });
    if (range) {
      if (max === 0) {
        max = util.now()
          .getTime();
      }
      return {
        start: new Date(min),
        end: new Date(max)
      };
    }
  };

  self.lastDate = function (spec) {
    var endDate;
    var layersDateRange = self.dateRange(spec);
    var now = util.today();
    if (layersDateRange && layersDateRange.end > now) {
      endDate = layersDateRange.end;
    } else {
      endDate = util.today();
    }
    return endDate;
  };

  self.isValid = function (date) {
    var endDate = self.lastDate(spec);
    if (self.maxZoom > 3) {
      if (date > util.now()) {
        return false;
      }
    } else {
      if (date > endDate) {
        return false;
      }
    }
    if (config.startDate) {
      let startDate = util.parseDateUTC(config.startDate);
      if (date < startDate) {
        return false;
      }
    }
    return true;
  };

  self.minDate = function () {
    if (config.startDate) {
      return util.parseDateUTC(config.startDate);
    }
    return util.minDate();
  };

  self.maxDate = function () {
    var endDate = self.lastDate(spec);
    return endDate;
  };

  self.maxZoom = null;

  self.save = function (state) {
    state.t = self.selected.toISOString()
      .split('T')[0] + '-' + 'T' + self.selected.toISOString()
      .split('T')[1].slice(0, -5) + 'Z';
    if (self.selectedZoom) {
      state.z = self.selectedZoom.toString();
    }
  };

  self.load = function (state) {
    if (state.t) {
      self.select(state.t);
    }
    if (state.z) {
      self.selectedZoom = Number(state.z);
    }
  };
  init();
  return self;
};
