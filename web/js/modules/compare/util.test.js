import { mapLocationToCompareState, isFromActiveCompareRegion, getFormattedMonthAbbrevDates } from './util';
import { initialCompareState } from './reducers';

const stateFromLocation = { compare: initialCompareState };
const PERMALINK_STATE = { ca: '' };

test('mapLocationToCompareState sets compare as active is ca is defined permalink [compare-permalink]', () => {
  const response = mapLocationToCompareState(PERMALINK_STATE, stateFromLocation);
  expect(stateFromLocation.compare.active).toBeFalsy();
  expect(response.compare.active).toBeTruthy();
});

test('mapLocationToCompareState sets bStatesInitiated to true when ca is defined [compare-permalink-bstates]', () => {
  const response = mapLocationToCompareState(PERMALINK_STATE, stateFromLocation);
  expect(response.compare.bStatesInitiated).toBe(true);
});

test('mapLocationToCompareState sets activeString to activeB when ca is "false" [compare-permalink-false]', () => {
  const response = mapLocationToCompareState({ ca: 'false' }, stateFromLocation);
  expect(response.compare.activeString).toEqual('activeB');
});

test('mapLocationToCompareState does not set activeString to activeB when ca is not "false" [compare-permalink-not-false]', () => {
  const response = mapLocationToCompareState({ ca: 'true' }, stateFromLocation);
  expect(response.compare.activeString).not.toEqual('activeB');
});

test('mapLocationToCompareState resets compare to initialCompareState when ca is undefined [compare-permalink-reset]', () => {
  const modifiedState = {
    compare: { ...initialCompareState, active: true, bStatesInitiated: true },
  };
  const response = mapLocationToCompareState({}, modifiedState);
  expect(response.compare).toEqual(initialCompareState);
});

test('isFromActiveCompareRegion returns true when compare is not active [compare-util-inactive]', () => {
  const result = isFromActiveCompareRegion([100, 100], 'active', 50, { active: false });
  expect(result).toBe(true);
});

test('isFromActiveCompareRegion returns true when compare is not provided [compare-util-no-compare]', () => {
  const result = isFromActiveCompareRegion([100, 100], 'active', 50);
  expect(result).toBe(true);
});

test('isFromActiveCompareRegion returns false when mode is not swipe [compare-util-not-swipe]', () => {
  const result = isFromActiveCompareRegion([100, 100], 'active', 50, {
    active: true,
    mode: 'opacity',
    isCompareA: true,
  });
  expect(result).toBe(false);
});

test('isFromActiveCompareRegion returns false when isCompareA and coords exceed swipeOffset [compare-util-swipe-a-over]', () => {
  const result = isFromActiveCompareRegion([60, 0], 'active', 50, {
    active: true,
    mode: 'swipe',
    isCompareA: true,
  });
  expect(result).toBe(false);
});

test('isFromActiveCompareRegion returns false when isCompareA and group is not active [compare-util-swipe-a-wrong-group]', () => {
  const result = isFromActiveCompareRegion([40, 0], 'activeB', 50, {
    active: true,
    mode: 'swipe',
    isCompareA: true,
  });
  expect(result).toBe(false);
});

test('isFromActiveCompareRegion returns true when isCompareA, coords within swipeOffset and group is active [compare-util-swipe-a-valid]', () => {
  const result = isFromActiveCompareRegion([40, 0], 'active', 50, {
    active: true,
    mode: 'swipe',
    isCompareA: true,
  });
  expect(result).toBe(true);
});

test('isFromActiveCompareRegion returns false when not isCompareA and coords are less than swipeOffset [compare-util-swipe-b-under]', () => {
  const result = isFromActiveCompareRegion([40, 0], 'activeB', 50, {
    active: true,
    mode: 'swipe',
    isCompareA: false,
  });
  expect(result).toBe(false);
});

test('isFromActiveCompareRegion returns false when not isCompareA and group is not activeB [compare-util-swipe-b-wrong-group]', () => {
  const result = isFromActiveCompareRegion([60, 0], 'active', 50, {
    active: true,
    mode: 'swipe',
    isCompareA: false,
  });
  expect(result).toBe(false);
});

test('isFromActiveCompareRegion returns true when not isCompareA, coords exceed swipeOffset and group is activeB [compare-util-swipe-b-valid]', () => {
  const result = isFromActiveCompareRegion([60, 0], 'activeB', 50, {
    active: true,
    mode: 'swipe',
    isCompareA: false,
  });
  expect(result).toBe(true);
});

test('getFormattedMonthAbbrevDates returns dateA and dateB keys [compare-util-formatted-dates]', () => {
  const dateA = new Date('2021-01-15');
  const dateB = new Date('2021-06-20');
  const result = getFormattedMonthAbbrevDates(dateA, dateB);
  expect(result).toHaveProperty('dateA');
  expect(result).toHaveProperty('dateB');
});

test('getFormattedMonthAbbrevDates returns formatted string values [compare-util-formatted-dates-values]', () => {
  const dateA = new Date('2021-01-15');
  const dateB = new Date('2021-06-20');
  const result = getFormattedMonthAbbrevDates(dateA, dateB);
  expect(typeof result.dateA).toBe('string');
  expect(typeof result.dateB).toBe('string');
});
