import {
  OPEN_ANIMATION,
  EXIT_ANIMATION,
  PLAY_ANIMATION,
  STOP_ANIMATION,
  UPDATE_FRAME_RATE,
  TOGGLE_LOOPING,
  UPDATE_START_DATE,
  UPDATE_END_DATE,
  TOGGLE_GIF
} from './constants';

export function onActivate() {
  return {
    type: OPEN_ANIMATION
  };
}
export function onClose() {
  return {
    type: EXIT_ANIMATION
  };
}
export function play() {
  return {
    type: PLAY_ANIMATION
  };
}
export function stop() {
  return {
    type: STOP_ANIMATION
  };
}
export function toggleLooping() {
  return {
    type: TOGGLE_LOOPING
  };
}
export function changeFrameRate(num) {
  return {
    type: UPDATE_FRAME_RATE,
    value: num
  };
}
export function changeStartDate(date) {
  return {
    type: UPDATE_START_DATE,
    value: date
  };
}
export function changeEndDate(date) {
  return {
    type: UPDATE_END_DATE,
    value: date
  };
}
export function toggleComponentGifActive() {
  return {
    type: TOGGLE_GIF
  };
}
