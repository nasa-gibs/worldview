import { LOADING_START, LOADING_STOP } from './constants';

export const LOADING_GRANULES = 'LOADING/GRANULES';
export const MAP_LOADING = 'LOADING/MAP_LOADING';

export function startLoading(key, msg) {
  return (dispatch, getState) => {
    const { animation } = getState();
    if (animation.isPlaying) return;
    dispatch({
      type: LOADING_START,
      key,
      msg,
    });
  };
}

export function stopLoading(key) {
  return (dispatch, getState) => {
    const { animation } = getState();
    if (animation.isPlaying) return;
    dispatch({
      type: LOADING_STOP,
      key,
    });
  };
}
