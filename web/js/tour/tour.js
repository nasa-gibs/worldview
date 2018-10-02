export function parse(state, errors, config) {
  var tourId = state.tr;
  if (tourId) {
    if (!config.tour[tourId]) {
      delete state.tr;
      errors.push({
        message: 'Unsupported tour: ' + tourId
      });
    }
  }
};
