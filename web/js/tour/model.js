import util from '../util/util';

export function tourModel(config) {
  var self = {};
  self.selected = null;
  self.events = util.events();

  self.select = function (tourId) {
    var tour = 1;
    if (!tour) {
      throw new Error('Invalid tour: ' + tourId);
    }
    var updated = false;
    if (!self.selected || self.selected.id !== tourId) {
      self.selected = tour;
      self.events.trigger('select', tour);
    }
    return updated;
  };

  self.save = function (state) {
    // console.log(self.selected);
    // state.tr = self.selected.id;
  };

  self.load = function (state) {
    var tourId = state.tr;
    if (tourId) {
      self.select(tourId);
    }
  };

  return self;
};
