import util from '../util/util';

export function dateModel(config, spec) {
  spec = spec || {};

  var self = {};
  self.events = util.events();
  self.selected = null;

  self.monthAbbr = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  var init = function () {
    var initial = spec.initial || util.today();
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
    if (date > util.today()) {
      date = util.today();
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
    if (date > util.today()) {
      return false;
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
    return util.today();
  };

  self.save = function (state) {
    state.t = self.selected.toISOString()
      .split('T')[0];
    state.t2 = self.selected.toISOString()
      .split('T')[1].slice(0, -5).replace(/:/g, '-');
    if (self.selectedZoom) {
      state.z = self.selectedZoom.toString();
    }
  };

  self.load = function (state) {
    if (state.t) {
      self.select(state.t);
    }
    // If there is a time, load using the corresponding date state
    if (state.t && state.t2) {
      self.select(state.t);
    }
    if (state.z) {
      self.selectedZoom = Number(state.z);
    }
  };
  init();
  return self;
};
