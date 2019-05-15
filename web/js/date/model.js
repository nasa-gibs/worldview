import util from '../util/util';

export function dateModel(models, config, spec) {
  spec = spec || {};

  var self = {};
  self.events = util.events();
  self.selected = null;
  self.selectedB = null;
  self.activeDate = 'selected';

  // selected zoom level/timescale
  self.selectedZoom = null;

  // selected interval
  self.interval = null;

  // custom interval
  self.customSelected = null; // boolean
  self.customDelta = null; // number
  self.customInterval = null;

  self.monthAbbr = [
    'JAN',
    'FEB',
    'MAR',
    'APR',
    'MAY',
    'JUN',
    'JUL',
    'AUG',
    'SEP',
    'OCT',
    'NOV',
    'DEC'
  ];

  const timeScaleFromNumberKey = {
    '0': 'custom',
    '1': 'year',
    '2': 'month',
    '3': 'day',
    '4': 'hour',
    '5': 'minute'
  };

  var init = function() {
    var initial = spec.initial || util.now();
    self.select(initial);
  };
  self.initCompare = function() {
    if (!self.selectedB) {
      self.select(util.dateAdd(self.selected, 'day', -7), 'selectedB');
    }
  };
  // set selectedZoom level
  self.setSelectedZoom = (zoomLevel) => {
    self.selectedZoom = zoomLevel;
    self.events.trigger('state-update');
  };
  // select increment from animation dialog
  self.changeIncrement = (zoomLevel) => {
    // if custom
    if (zoomLevel === 0) {
      self.customSelected = true;
      // check for customInterval selection else default to current interval
      self.interval = self.customInterval ? self.customInterval : self.interval;
    } else {
      self.customSelected = false;
      self.interval = zoomLevel;
    }
  };
  self.setActiveDate = function(dateString) {
    self.activeDate = dateString;
    self.events.trigger('state-update');
  };
  // set custom interval from panel
  self.setCustomInterval = (delta, interval) => {
    self.interval = interval;
    self.customDelta = delta;
    self.customInterval = interval;
    self.events.trigger('state-update');
    self.events.trigger('custom-interval-update');
  };
  // select interval from tooltip
  self.setSelectedInterval = (interval, customSelected) => {
    self.interval = interval;
    self.customSelected = customSelected;
    self.events.trigger('state-update');
  };
  self.string = function() {
    return util.toISOStringDate(self.selected);
  };

  self.select = function(date, selectionStr) {
    if (!date) return null;
    selectionStr = selectionStr || self.activeDate;
    date = self.clamp(date);
    var updated = false;
    if (
      !self[selectionStr] ||
      date.getTime() !== self[selectionStr].getTime()
    ) {
      self[selectionStr] = date;
      if (selectionStr === self.activeDate) {
        self.events.trigger('select', date, selectionStr);
      }
      updated = true;
    } else {
      // necessary to handle 00:00:00 not triggering and saving as either the
      // previous date of 23:00:00 or 01:00:00
      self.events.trigger('select', date, selectionStr);
    }
    return updated;
  };

  self.add = function(interval, amount, selectionStr) {
    selectionStr = selectionStr || self.activeDate;
    self.select(
      util.dateAdd(self[selectionStr], interval, amount),
      selectionStr
    );
  };

  self.clamp = function(date) {
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

  self.isValid = function(date) {
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

  self.minDate = function() {
    if (config.startDate) {
      return util.parseDateUTC(config.startDate);
    }
    return util.minDate();
  };

  self.maxDate = function() {
    var endDate = models.layers.lastDate(spec);
    return endDate;
  };

  self.maxZoom = null;

  var dateToStringForUrl = function(date) {
    return (
      date.toISOString().split('T')[0] +
      '-' +
      'T' +
      date
        .toISOString()
        .split('T')[1]
        .slice(0, -5) +
      'Z'
    );
  };
  self.save = function(state) {
    state.t = dateToStringForUrl(self.selected);
    if (self.selectedZoom) {
      state.z = self.selectedZoom.toString();
    }
    if (config.features.compare) {
      if (self.selectedB) {
        state.t1 = dateToStringForUrl(self.selectedB);
      }
    }
    // interval
    if (self.interval) {
      state.inti = self.interval.toString();
    }
    // only if custom selected, save custom interval and delta state
    if (self.customSelected) {
      if (self.customInterval) {
        state.intci = self.customInterval.toString();
      }
      // if delta is 1, then it won't be saved since this would be a default
      if (self.customDelta && self.customDelta > 1) {
        state.intcs = self.customSelected.toString();
        state.intcd = self.customDelta.toString();
      }
    }
  };

  self.load = function(state) {
    // COMPARE ACTIVE? - A dragger/tab selected : state.ca === 'true', B is state.ca === 'false
    if (state.ca === 'false') {
      self.setActiveDate('selectedB');
    }
    // TIME
    if (state.t) {
      self.select(state.t, 'selected');
    }
    // TIMESCALE (ZOOM) - can't change in order to support older, established permalinks
    if (state.z) {
      self.selectedZoom = Number(state.z);
    } else {
      self.selectedZoom = 3;
    }
    // TIME FOR DRAGGER B
    if (state.t1) {
      self.select(state.t1, 'selectedB');
    }
    // # INTERVALS
    // selected interval timescale
    if (state.inti) {
      self.interval = state.inti;
    } else {
      self.interval = 3;
    }
    // custom interval delta
    if (state.intcd) {
      self.customDelta = Number(state.intcd);
    }
    // custom interval timescale
    if (state.intci) {
      self.customInterval = Number(state.intci);
    }
    // interval custom selected
    if (state.intcs) {
      if (state.intcs === 'true') {
        self.customSelected = true;
      } else if (state.intcs === 'false') {
        self.customSelected = false;
      }
    }
  };
  init();
  return self;
}
