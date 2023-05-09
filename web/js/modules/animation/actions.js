import {
  OPEN_ANIMATION,
  EXIT_ANIMATION,
  PLAY_ANIMATION,
  STOP_ANIMATION,
  UPDATE_FRAME_RATE,
  TOGGLE_LOOPING,
  UPDATE_START_AND_END_DATE,
  UPDATE_START_DATE,
  UPDATE_END_DATE,
  UPDATE_CROP_BOUNDS,
  TOGGLE_GIF,
  COLLAPSE_ANIMATION,
  TOGGLE_AUTOPLAY,
  PLAY_KIOSK_ANIMATIONS,
} from './constants';
import util from '../../util/util';
import { TIME_SCALE_FROM_NUMBER } from '../date/constants';
import { getSelectedDate } from '../date/selectors';

export function onActivate() {
  return (dispatch, getState) => {
    const { date, animation } = getState();
    const {
      customSelected, customDelta, delta, customInterval, interval,
    } = date;
    const activeDate = getSelectedDate(getState());
    if (!animation.startDate || !animation.endDate) {
      const timeScaleChangeUnit = customSelected
        ? TIME_SCALE_FROM_NUMBER[customInterval]
        : TIME_SCALE_FROM_NUMBER[interval];
      const deltaChangeAmt = customSelected ? customDelta : delta;
      const tenFrameDelta = 10 * deltaChangeAmt;
      const tenFramesBefore = util.dateAdd(activeDate, timeScaleChangeUnit, -tenFrameDelta);
      const tenFramesAfter = util.dateAdd(activeDate, timeScaleChangeUnit, tenFrameDelta);
      const startDate = animation.startDate
        ? animation.startDate
        : date.appNow < tenFramesAfter
          ? tenFramesBefore
          : activeDate;
      const endDate = animation.endDate
        ? animation.endDate
        : date.appNow < tenFramesAfter
          ? activeDate
          : tenFramesAfter;
      dispatch({ type: UPDATE_START_AND_END_DATE, startDate, endDate });
    }
    dispatch({ type: OPEN_ANIMATION });
  };
}
export function onClose() {
  return {
    type: EXIT_ANIMATION,
  };
}
export function play() {
  return {
    type: PLAY_ANIMATION,
  };
}
export function stop() {
  return {
    type: STOP_ANIMATION,
  };
}
export function toggleLooping() {
  return {
    type: TOGGLE_LOOPING,
  };
}
export function changeFrameRate(num) {
  return {
    type: UPDATE_FRAME_RATE,
    value: num,
  };
}
export function changeStartAndEndDate(startDate, endDate) {
  return {
    type: UPDATE_START_AND_END_DATE,
    startDate,
    endDate,
  };
}
export function changeStartDate(date) {
  return {
    type: UPDATE_START_DATE,
    value: date,
  };
}
export function changeEndDate(date) {
  return {
    type: UPDATE_END_DATE,
    value: date,
  };
}
export function changeCropBounds(bounds) {
  return {
    type: UPDATE_CROP_BOUNDS,
    value: bounds,
  };
}
export function toggleComponentGifActive() {
  return {
    type: TOGGLE_GIF,
  };
}
export function toggleAnimationCollapse() {
  return {
    type: COLLAPSE_ANIMATION,
  };
}
export function toggleAnimationAutoplay() {
  return {
    type: TOGGLE_AUTOPLAY,
  };
}
export function playKioskAnimation(startDate, endDate) {
  return {
    type: PLAY_KIOSK_ANIMATIONS,
    startDate,
    endDate,
  };
}
