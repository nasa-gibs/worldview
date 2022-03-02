import { LOADING_START, LOADING_STOP } from './constants';

export function startLoading(title, msg) {
  return {
    type: LOADING_START,
    title,
    msg,
  };
}

export function stopLoading() {
  return {
    type: LOADING_STOP,
  };
}
