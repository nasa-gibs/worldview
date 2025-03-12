import update from 'immutability-helper';
import { initialChartingState } from './reducers';
import { formatDisplayDate } from '../date/util';

export function mapLocationToChartingState(parameters, stateFromLocation) {
  if (parameters.cha === 'true') {
    stateFromLocation = update(stateFromLocation, {
      charting: {
        active: { $set: true },
      },
    });
    if (parameters.chc) {
      stateFromLocation = update(stateFromLocation, {
        charting: {
          aoiActive: { $set: true },
          aoiSelected: { $set: true },
        },
      });
    }
    if (!parameters.cht2) {
      stateFromLocation = update(stateFromLocation, {
        charting: {
          timeSpanSelection: { $set: 'date' },
        },
      });
    }
  } else {
    stateFromLocation = update(stateFromLocation, {
      charting: { $set: initialChartingState },
    });
  }
  return stateFromLocation;
}

export const getFormattedMonthAbbrevDates = function(selected, selectedB) {
  const dateA = formatDisplayDate(selected);
  const dateB = formatDisplayDate(selectedB);
  return { dateA, dateB };
};
