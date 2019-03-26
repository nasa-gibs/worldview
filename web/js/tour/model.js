import util from '../util/util';

export function tourModel(config) {
  var self = {};
  self.active = false;
  self.selected = null;
  self.events = util.events();

  self.toggle = function() {
    self.active = !self.active;
    self.events.trigger('toggle');
  };

  self.select = function(storyId) {
    var story = config.stories[storyId];
    if (!story) {
      console.warn('Unsupported tour: ' + storyId);
    }
    var updated = false;
    if (!self.selected || self.selected.id !== storyId) {
      self.selected = story;
      self.events.trigger('select', story);
    }
    return updated;
  };

  self.save = function(state) {
    if (!self.active) {
      if (state.tr) delete state.tr;
    } else {
      state.tr = self.selected.id;
    }
  };

  self.load = function(state) {
    var storyId = state.tr;
    if (storyId) {
      self.select(storyId);
    }
    return self;
  };

  return self;
}
