import util from '../../util/util';
import { subdailyLayersActive } from '../layers/selectors';
import { TIME_SCALE_FROM_NUMBER } from '../date/constants';
import { formatDisplayDate, getNextImageryDelta } from '../date/util';

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
  const frames = [];
  const toDate = new Date(endDate);
  const isSubDaily = subdailyLayersActive(state);
  let current = new Date(startDate);
  const useDelta = customSelected && customDelta ? customDelta : delta;
  const increment = customSelected
    ? TIME_SCALE_FROM_NUMBER[customInterval]
    : TIME_SCALE_FROM_NUMBER[interval];

  while (current <= toDate) {
    if (frames.length >= MAX_FRAMES) return false;
    frames.push({
      date: current,
      text: showDates ? formatDisplayDate(current, isSubDaily) : '',
      delay: 1000 / animation.speed,
    });
    current = util.dateAdd(current, increment, autoSelected
      ? getNextImageryDelta(layers.active.layers, current, 1)
      : useDelta);
  }
  return frames;
}
