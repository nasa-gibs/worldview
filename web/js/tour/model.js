import util from '../util/util';

export function tourModel(config) {
  var self = {};
  self.selected = null;
  self.events = util.events();

  self.select = function (storyId) {
    var story = config.stories[storyId];
    if (!story) {
      throw new Error('Invalid tour: ' + storyId);
    }
    var updated = false;
    if (!self.selected || self.selected.id !== storyId) {
      self.selected = story;
      self.events.trigger('select', story);
    }
    return updated;
  };

  self.save = function (state) {
    if (state.tr) {
      state.tr = self.selected.id;
    }
  };

  self.load = function (state) {
    var storyId = state.tr;
    if (storyId) {
      self.select(storyId);
    }
  };

  return self;
};
