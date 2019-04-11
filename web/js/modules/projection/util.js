import { get as lodashGet } from 'lodash';
export function getProjInitialState(config) {
  const selected = lodashGet(
    config,
    `projections.${config.defaults.projection}`
  );
  return {
    id: selected ? selected.id : 'geographic',
    selected: selected || {}
  };
}
