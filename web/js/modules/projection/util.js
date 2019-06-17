import { get as lodashGet } from 'lodash';
import update from 'immutability-helper';

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
export function mapLocationToProjState(parameters, stateFromLocation, state) {
  const projId = lodashGet(stateFromLocation, 'proj.id');
  if (projId) {
    let selected = lodashGet(state, `config.projections.${projId}`) || {};
    stateFromLocation = update(stateFromLocation, {
      proj: { selected: { $set: selected } }
    });
  }
  return stateFromLocation;
}
