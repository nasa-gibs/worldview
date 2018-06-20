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
    var endDate = models.layers.lastDate(spec);
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

  self.isValid = function (date) {
    var endDate = models.layers.lastDate(spec);
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
    var endDate = models.layers.lastDate(spec);
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
