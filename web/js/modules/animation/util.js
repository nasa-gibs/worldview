import { round as lodashRound, get as lodashGet } from 'lodash';
import update from 'immutability-helper';
import moment from 'moment';
import canvg from '../../util/canvg';
import util from '../../util/util';

/**
 * Snap the value for the date/time to the closest previous playback step so that
 * th date/time properly syncs when looping. This avoids issues where the
 * first playback is not in sync with subsequent playbacks due to the current
 * time not being snapped to a proper step (when calculated from startDate).
 *
 * @param {*} currDate
 * @param {*} startDate
 * @param {*} endDate
 * @param {*} interval
 * @param {*} delta
 */
export function snapToIntervalDelta(currDate, startDate, endDate, interval, delta) {
  // moment pluralizes: 'days', 'hours', etc
  const units = `${interval}s`;
  let tempDate = startDate;
  let currentDate;
  let prevMoment;
  let nextMoment;

  while (tempDate <= endDate) {
    prevMoment = moment.utc(tempDate);
    nextMoment = moment.utc(tempDate).add(delta, units);
    if (currDate >= prevMoment && currDate <= nextMoment) {
      currentDate = new Date(prevMoment);
      break;
    }
    tempDate = new Date(nextMoment);
  }
  return currentDate || startDate;
}

/**
 * Calculate the required number of steps (frames) required for the animation
 * @param {Date} start        | The date of the first frame of animation
 * @param {Date} end          | The date of the last frame of animation
 * @param {String} interval   | The animation step value (Year/Month/Day/Custom) separating frames
 * @param {Number} delta      | Rate of change between states; defaults to 1 second
 * @param {Number} maxToCheck | The limit on the total number of frames to be used
 *
 * @return {Number} | The total number of frames required
 */
export function getNumberOfSteps(start, end, interval, delta = 1, maxToCheck) {
  let i = 1;
  let currentDate = start;
  let nextDate = util.dateAdd(start, interval, delta);
  if (nextDate > end) {
    i = 1;
    return i;
  }
  while (currentDate < end) {
    i += 1;
    currentDate = util.dateAdd(currentDate, interval, delta);
    nextDate = util.dateAdd(currentDate, interval, delta);
    // checking to see if next date is after end date to prevent creation of extra frame
    if (nextDate > end) {
      return i;
    }
    // if checking for a max number limit, break out after reaching it
    if (maxToCheck && i >= maxToCheck) {
      return i;
    }
  }
  return i;
}

export function getStampProps(
  stampWidthRatio,
  breakPoint,
  stampWidth,
  dimensions,
  width,
  height,
) {
  const dateStamp = {};
  let stampHeight;
  let stampHeightByImageWidth;
  // Set Logo-stamp dimensions based upon smallest total image dimension
  if (dimensions.w < breakPoint) {
    stampHeight = (width * 0.7) / stampWidthRatio < 60
      ? (width * 0.7) / stampWidthRatio
      : 60;
    dateStamp.fontSize = dimensions.h > stampHeight * 1.5 ? lodashRound(stampHeight * 0.65) : 0;
    dateStamp.align = 'left';
    dateStamp.x = width * 0.01;
    dateStamp.y = height - (dateStamp.fontSize + height * 0.01) - 4;
  } else {
    stampWidth = width * 0.4;
    stampHeightByImageWidth = stampWidth / stampWidthRatio;
    stampHeight = stampHeightByImageWidth < 20
      ? 20
      : stampHeightByImageWidth > 60
        ? 60
        : stampHeightByImageWidth;
    dateStamp.fontSize = dimensions.h > stampHeight * 1.5 ? lodashRound(stampHeight * 0.65) : 0;
    dateStamp.y = height - (dateStamp.fontSize + height * 0.01) - 4;
    dateStamp.x = width * 0.01;
    dateStamp.align = 'left';
  }
  return { stampHeight, dateStamp };
}

export function svgToPng(svgURL, stampHeight) {
  const canvasEl = document.createElement('canvas');
  const canvgOptions = {
    log: false,
    ignoreMouse: true,
    scaleHeight: stampHeight,
  };
  canvg(canvasEl, svgURL, canvgOptions);
  const newImage = new Image();
  newImage.src = canvasEl.toDataURL('image/png');
  newImage.width = canvasEl.width;
  newImage.height = canvasEl.height;

  return newImage;
}

export function mapLocationToAnimationState(
  parameters,
  stateFromLocation,
  state,
  config,
) {
  const startDate = lodashGet(stateFromLocation, 'animation.startDate');
  const endDate = lodashGet(stateFromLocation, 'animation.endDate');
  if (parameters.playanim && parameters.ab) {
    stateFromLocation = update(stateFromLocation, {
      animation: { isPlaying: { $set: true } },
    });
  } else if (
    parameters.ab !== 'on'
    && (!parameters.ae || (!parameters.as && (!!endDate || !!startDate)))
  ) {
    // wipe anim start & end dates on tour change

    stateFromLocation = update(stateFromLocation, {
      animation: { endDate: { $set: undefined } },
    });

    stateFromLocation = update(stateFromLocation, {
      animation: { startDate: { $set: undefined } },
    });
  }
  return stateFromLocation;
}
