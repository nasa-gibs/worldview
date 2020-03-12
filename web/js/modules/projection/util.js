import { get as lodashGet } from 'lodash';
import update from 'immutability-helper';

export function getProjInitialState(config) {
  const selected = lodashGet(
    config,
    `projections.${config.defaults.projection}`,
  );
  return {
    id: selected ? selected.id : 'geographic',
    selected: selected || {},
  };
}
export function parseProjection(str, config) {
  const exists = !!lodashGet(config, `projections.${str}`);
  return exists ? str : 'geographic';
}
/**
 * Update 'proj.selected' object from config based
 * on updated states `proj.id` value
 *
 * @param {Object} parameters | parameters parsed from permalink
 * @param {Object} stateFromLocation | State derived from permalink parsers
 * @param {Object} state | initial state before location POP action
 */
export function mapLocationToProjState(parameters, stateFromLocation, state) {
  const projId = lodashGet(stateFromLocation, 'proj.id');
  if (parameters.p) {
    const selected = lodashGet(state, `config.projections.${projId}`);
    if (selected) {
      stateFromLocation = update(stateFromLocation, {
        proj: { selected: { $set: selected } },
      });
    }
  } else if (parameters.switch) {
    const id = parameters.switch;
    const selected = lodashGet(state, `config.projections.${id}`);
    if (selected) {
      const newProjState = { id, selected };

      stateFromLocation = update(stateFromLocation, {
        proj: { $set: newProjState },
      });
    }
  } else {
    const selected = lodashGet(state, 'config.projections.geographic');
    stateFromLocation = update(stateFromLocation, {
      proj: { selected: { $set: selected } },
    });
  }
  return stateFromLocation;
}
