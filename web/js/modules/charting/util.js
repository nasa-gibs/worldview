import update from 'immutability-helper';
import { initialChartingState } from './reducers';
import { formatDisplayDate } from '../date/util';

export function mapLocationToChartingState(parameters, stateFromLocation) {
  stateFromLocation = update(stateFromLocation, {
    charting: { $set: initialChartingState },
  });
  return stateFromLocation;
}

export const getFormattedMonthAbbrevDates = function(selected, selectedB) {
  const dateA = formatDisplayDate(selected);
  const dateB = formatDisplayDate(selectedB);
  return { dateA, dateB };
};
