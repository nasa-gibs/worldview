import util from '../util/util';

export function dateModel(config, spec) {
  spec = spec || {};

  var self = {};
  self.events = util.events();
  self.selected = null;
  self.selectedA = null;
  self.selectedB = null;
  self.activeDate = 'selected';

  self.monthAbbr = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  var init = function () {
    var initial = spec.initial || util.now();
    self.select(initial);
    if (config.features.compare) {
      self.select(initial, 'selectedA');
      self.select(util.dateAdd(initial, 'day', -5), 'selectedB');
    }
  };

  self.string = function () {
    return util.toISOStringDate(self.selected);
  };

  self.select = function (date, selection) {
    selection = selection || 'selected';
    date = self.clamp(date);
    var updated = false;
    if (!self[selection] || date.getTime() !== self[selection].getTime()) {
      self[selection] = date;
      if (selection === self.activeDate) {
        self.events.trigger('select', date);
      }
      updated = true;
    }
    return updated;
  };

  self.add = function (interval, amount, selection) {
    selection = selection || self.selected;
    self.select(util.dateAdd(selection, interval, amount), selection);
  };

  self.clamp = function (date) {
    if (self.maxZoom > 3) {
      if (date > util.now()) {
        date = util.now();
      }
    } else {
      if (date > util.today()) {
        date = util.today();
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
    if (self.maxZoom > 3) {
      if (date > util.now()) {
        return false;
      }
    } else {
      if (date > util.today()) {
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
    return util.now();
  };

  self.maxZoom = null;

  var dateToStringForUrl = function(date) {
    return date.toISOString()
      .split('T')[0] + '-' + 'T' + self.selected.toISOString()
      .split('T')[1].slice(0, -5) + 'Z';
  };
  self.save = function (state) {
    state.t = dateToStringForUrl(self.selected);
    if (self.selectedZoom) {
      state.z = self.selectedZoom.toString();
    }
    if (config.features.compare) {
      state.t1 = dateToStringForUrl(self.selectedA);
      state.t2 = dateToStringForUrl(self.selectedB);
    }
  };

  self.load = function (state) {
    if (state.t) {
      self.select(state.t);
    }
    if (state.z) {
      self.selectedZoom = Number(state.z);
    }
    if (state.t1) {
      self.select(state.t1, 'selectedA');
    }
    if (state.t2) {
      self.select(state.t2, 'selectedB');
    }
  };
  init();
  return self;
};
