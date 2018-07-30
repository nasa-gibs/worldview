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
    models.layers.updateLayerGroup(self.isCompareA ? 'active' : 'activeB');
    models.date.setActiveDate(self.isCompareA ? 'selected' : 'selectedB');
    self.events.trigger('toggle-state');
    self.events.trigger('change');
  };
  self.setMode = function(mode) {
    self.mode = mode;
    self.events.trigger('mode');
    self.events.trigger('change');
  };
  self.save = function(state) {
    if (!self.active) {
      if (state.ca) delete state.ca;
      if (state.cm) delete state.ca;
    } else {
      if (self.isCompareA !== state.ca) {
        state.ca = self.isCompareA;
      }
      if (self.mode !== state.cm) {
        state.cm = self.mode;
      }
    }
  };
  self.load = function(state) {
    if (state.ca) {
      self.active = true;
      self.isCompareA = state.ca === 'true';
    }
    if (state.cm) {
      self.active = true;
      self.mode = state.cm;
    }
  };
  return self;
}
