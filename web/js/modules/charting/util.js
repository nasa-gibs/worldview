import update from 'immutability-helper';
import { initialChartingState } from './reducers';
import { formatDisplayDate } from '../date/util';

export function mapLocationToChartingState(parameters, stateFromLocation) {
  stateFromLocation = update(stateFromLocation, {
    charting: { $set: initialChartingState },
  });
  return stateFromLocation;
}
/**
 * Is layer on active side of Map while in swipe mode -
 * No other modes will allow for running-data or vector interactions
 * @param {Array} coords | Coordinates of hover point
 * @param {Object} layerAttributes | Layer Properties
 */
// export function isFromActiveCompareRegion(coords, group, compare = {}, swipeOffset) {
//   const { active, mode, isCompareA } = compare;
//   if (active) {
//     if (mode !== 'swipe') {
//       return false;
//     }
//     if (isCompareA) {
//       if (coords[0] > swipeOffset || group !== 'active') {
//         return false;
//       }
//     } else if (coords[0] < swipeOffset || group !== 'activeB') {
//       return false;
//     }
//   }
//   return true;
// }

export const getFormattedMonthAbbrevDates = function(selected, selectedB) {
  const dateA = formatDisplayDate(selected);
  const dateB = formatDisplayDate(selectedB);
  return { dateA, dateB };
};
