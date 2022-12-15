import { CHANGE_PROJECTION } from './constants';
import { onProjectionSwitch } from '../product-picker/actions';
import { stop } from '../animation/actions';

export default function changeProjection(id) {
  return (dispatch, getState) => {
    const { config, animation: { isPlaying } } = getState();
    const proj = config.projections[id];

    if (!proj) {
      throw new Error(`Invalid projection: ${id}`);
    }
    dispatch(onProjectionSwitch(id));
    if (isPlaying) {
      dispatch(stop());
    }
    dispatch({
      type: CHANGE_PROJECTION,
      id,
      selected: proj,
    });
  };
}
