import util from '../../util/util';
import { subdailyLayersActive } from '../layers/selectors';
import { TIME_SCALE_FROM_NUMBER } from '../date/constants';
import { formatDisplayDate, getValidDateRanges } from '../date/util';

export const MAX_FRAMES = 40;

/*
 * Build the ordered frame list for an animation. Frames are captured from the
 * map by date, so no imagery URLs are built here.
 *
 * @method getAnimationFrames
 *
 * @returns {array|boolean} array of {date, text, delay}, or false if the
 * frame count exceeds MAX_FRAMES
 */
export default function getAnimationFrames(options, state) {
  const { animation, date, layers } = state;
  const { showDates, startDate, endDate } = options;
  const {
    customInterval, interval, customDelta, delta, customSelected, autoSelected,
  } = date;
  const isSubDaily = subdailyLayersActive(state);

  const toFrame = (frameDate) => ({
    date: frameDate,
    text: showDates ? formatDisplayDate(frameDate, isSubDaily) : '',
    delay: 1000 / animation.speed,
  });

  // Auto steps to each available imagery date rather than by a fixed amount,
  // matching the play queue. Deriving a delta instead would depend on `interval`,
  // which auto does not set, and can land off an imagery date entirely.
  if (autoSelected) {
    const dateRanges = getValidDateRanges(
      layers.active.layers,
      new Date(startDate),
      new Date(endDate),
    );
    if (dateRanges.length > MAX_FRAMES) return false;
    // Layers without imagery still render, so keep a frame to capture them
    if (!dateRanges.length) return [toFrame(new Date(startDate))];
    return dateRanges.map(({ startDate: rangeStart }) => toFrame(new Date(rangeStart)));
  }

  const frames = [];
  const toDate = new Date(endDate);
  let current = new Date(startDate);
  const useDelta = customSelected && customDelta ? customDelta : delta;
  const increment = customSelected
    ? TIME_SCALE_FROM_NUMBER[customInterval]
    : TIME_SCALE_FROM_NUMBER[interval];

  while (current <= toDate) {
    if (frames.length >= MAX_FRAMES) return false;
    frames.push(toFrame(current));
    current = util.dateAdd(current, increment, useDelta);
  }
  return frames;
}
