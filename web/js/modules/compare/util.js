import update from 'immutability-helper';
import { initialCompareState } from './reducers';
import util from '../../util/util';

export function mapLocationToCompareState(parameters, stateFromLocation) {
  if (parameters.ca !== undefined) {
    stateFromLocation = update(stateFromLocation, {
      compare: { active: { $set: true } },
    });
    if (parameters.ca === 'false') {
      stateFromLocation = update(stateFromLocation, {
        compare: { activeString: { $set: 'activeB' } },
      });
      stateFromLocation = update(stateFromLocation, {
        compare: { bStatesInitiated: { $set: true } },
      });
    }
  } else {
    stateFromLocation = update(stateFromLocation, {
      compare: { $set: initialCompareState },
    });
  }
  return stateFromLocation;
}
/**
 * Is layer on active side of Map while in swipe mode -
 * No other modes will allow for running-data or vector interactions
 * @param {Array} coords | Coordinates of hover point
 * @param {Object} layerAttributes | Layer Properties
 */
export function isFromActiveCompareRegion(coords, layerAttributes, compareModel, swipeOffset) {
  if (compareModel && compareModel.active) {
    if (compareModel.mode !== 'swipe') {
      return false;
    }
    if (compareModel.isCompareA) {
      if (coords[0] > swipeOffset || layerAttributes.group !== 'active') {
        return false;
      }
    } else if (coords[0] < swipeOffset || layerAttributes.group !== 'activeB') {
      return false;
    }
  }
  return true;
}

export const getFormattedMonthAbbrevDates = function(selected, selectedB) {
  const dateA = util.toISOStringDateMonthAbbrev(selected);
  const dateB = util.toISOStringDateMonthAbbrev(selectedB);
  return { dateA, dateB };
};
