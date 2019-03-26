import util from '../util/util';
import wvui from '../ui/ui';

export function compareModel(models, config) {
  var self = {};
  self.active = false;
  self.isCompareA = true;
  self.mode = 'swipe';
  self.value = 50;
  self.events = util.events();

  self.toggle = function() {
    self.active = !self.active;
    wvui.close();
    self.events.trigger('toggle');
    self.events.trigger('change');
  };
  self.toggleState = function() {
    self.isCompareA = !self.isCompareA;
    models.layers.updateLayerGroup(self.isCompareA ? 'active' : 'activeB');
    models.date.setActiveDate(self.isCompareA ? 'selected' : 'selectedB');
    wvui.close();
    self.events.trigger('toggle-state');
    self.events.trigger('change');
  };
  self.setValue = function(value) {
    self.value = value;
    self.events.trigger('value');
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
      if (state.cm) delete state.cm;
      if (state.cv) delete state.cv;
    } else {
      if (self.isCompareA !== state.ca) {
        state.ca = self.isCompareA;
      }
      if (self.mode !== state.cm) {
        state.cm = self.mode;
      }
      if (self.value) {
        var stringValue = self.value.toString();
        if (self.mode === 'spy') {
          if (state.cv) delete state.cv;
        } else if (state.cv !== stringValue) {
          state.cv = stringValue;
        }
      }
    }
  };
  self.load = function(state) {
    if (!util.browser.small && !util.browser.mobileDevice) {
      if (state.ca) {
        self.active = true;
        self.isCompareA = state.ca === 'true';
      }
      if (state.cm) {
        self.active = true;
        self.mode = state.cm;
      }
      if (state.cv) {
        self.value = Number(state.cv);
      }
    }
    return self;
  };
  return self;
}
