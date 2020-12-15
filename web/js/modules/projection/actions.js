import { CHANGE_PROJECTION } from './constants';

// eslint-disable-next-line import/prefer-default-export
export function changeProjection(id) {
  return (dispatch, getState) => {
    const { config } = getState();
    const proj = config.projections[id];

    if (!proj) {
      throw new Error(`Invalid projection: ${id}`);
    }
    dispatch({
      type: CHANGE_PROJECTION,
      id,
      selected: proj,
    });
  };
}
