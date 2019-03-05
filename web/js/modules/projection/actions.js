import { CHANGE_PROJECTION } from './constants';

export function changeProjection(id, config) {
  const proj = config.projections[id];
  if (!proj) {
    throw new Error('Invalid projection: ' + id);
  }
  return {
    type: CHANGE_PROJECTION,
    id: id,
    selected: proj
  };
}
