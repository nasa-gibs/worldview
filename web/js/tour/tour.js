export function parse(state, errors, config) {
  var storyId = state.tr;
  if (storyId) {
    if (!config.stories[storyId]) {
      delete state.tr;
      errors.push({
        message: 'Unsupported tour: ' + storyId
      });
    }
  }
};
