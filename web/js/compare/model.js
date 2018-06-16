import util from '../util/util';

export function compareModel(models, config) {
  var self = {};
  self.active = false;
  self.isCompareA = true;
  self.mode = 'swipe';
  self.events = util.events();

  self.toggle = function() {
    self.active = !self.active;
    self.events.trigger('toggle');
    self.events.trigger('change');
  };
  self.toggleState = function() {
    self.isCompareA = !self.isCompareA;
    self.events.trigger('toggle');
    self.events.trigger('change');
  };
  self.setMode = function(mode) {
    self.mode = mode;
    self.events.trigger('change');
  };
  self.save = function(state) {
    if (self.active !== state.c) {
      state.c = self.active;
    }
    if (self.isCompareA !== state.ca) {
      state.ca = self.isCompareA;
    }
    if (self.mode !== state.cm) {
      state.cm = self.mode;
    }
  };
  self.load = function(state) {
    if (state.c) {
      self.active = state.c === 'true';
    }
    if (state.ca) {
      self.isCompareA = state.ca === 'true';
    }
    if (state.cm) {
      self.mode = state.cm;
    }
  };
  return self;
}
