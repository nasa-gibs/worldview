export function getProjInitialState(config) {
  const defaults = config.defaults;
  const projections = config.projections;

  return {
    id: 'geographic',
    selected:
      defaults &&
      projections &&
      defaults.projection &&
      projections[defaults.projection]
        ? projections[defaults.projection]
        : {}
  };
}
