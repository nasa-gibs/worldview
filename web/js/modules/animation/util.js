import { round as lodashRound, get as lodashGet } from 'lodash';
import canvg from 'canvg-browser';
import update from 'immutability-helper';
import moment from 'moment';
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
  const dateArray = [];
  let tempDate = startDate;
  let currentDate; let prevMoment; let
    nextMoment;

  while (tempDate <= endDate) {
    prevMoment = moment.utc(tempDate);
    nextMoment = moment.utc(tempDate).add(delta, units);
    if (currDate >= prevMoment && currDate <= nextMoment) {
      currentDate = new Date(prevMoment);
    }
    dateArray.push(tempDate);
    tempDate = new Date(nextMoment);
  }
  return currentDate || startDate;
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

/**
 * Returns the queueLength based on the play speed selected
 * @method getMaxQueueLength
 * @static
 *
 * @return {number}  The queueLength amount
 */
export function getMaxQueueLength(speed) {
  let queueLength = 10;
  switch (true) {
    case speed > 8 && speed <= 10:
      queueLength = 40;
      break;
    case speed > 7 && speed <= 8:
      queueLength = 32;
      break;
    case speed > 5 && speed <= 7:
      queueLength = 24;
      break;
    case speed > 3 && speed <= 5:
      queueLength = 16;
      break;
    case speed > 0 && speed <= 3:
      queueLength = 10;
      break;
    default:
      break;
  }
  return queueLength;
}

/*
 * default queueLength
 *
 * @method getQueueLength
 * @static
 *
 * @param startDate {object} JS date
 * @param endDate {object} JS date
 *
 * @returns {number} new buffer length
 *
 */
export function getQueueLength(startDate, endDate, speed, interval, delta) {
  let day = startDate;
  let i = 0;
  const maxQueueLength = getMaxQueueLength(speed);
  while (i <= maxQueueLength) {
    i++;
    day = util.dateAdd(day, interval, delta);
    if (day > endDate) {
      return i;
    }
  }
  return i;
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
