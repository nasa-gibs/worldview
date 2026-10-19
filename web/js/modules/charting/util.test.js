import { mapLocationToChartingState, getFormattedMonthAbbrevDates } from './util';
import { initialChartingState } from './reducers';
import { formatDisplayDate } from '../date/util';

jest.mock('./reducers', () => ({
  initialChartingState: {
    active: false,
    activeLayer: undefined,
    aoiActive: true,
    aoiSelected: false,
    aoiCoordinates: [],
    chartRequestInProgress: false,
    timeSpanSelection: 'range',
    timeSpanStartDate: undefined,
    timeSpanEndDate: undefined,
    fromButton: false,
    isChartOpen: false,
  },
}));

jest.mock('../date/util', () => ({
  formatDisplayDate: jest.fn((date) => `formatted-${date}`),
}));

const baseState = {
  charting: {
    active: false,
    aoiActive: false,
    aoiSelected: false,
    timeSpanSelection: 'range',
  },
};

describe('mapLocationToChartingState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resets charting to initialChartingState when cha is not "true"', () => {
    const result = mapLocationToChartingState({}, baseState);
    expect(result.charting).toEqual(initialChartingState);
  });

  it('resets charting to initialChartingState when cha is a non-"true" string', () => {
    const result = mapLocationToChartingState({ cha: 'false' }, baseState);
    expect(result.charting).toEqual(initialChartingState);
  });

  it('sets charting.active to true when cha is "true"', () => {
    const result = mapLocationToChartingState({ cha: 'true' }, baseState);
    expect(result.charting.active).toBe(true);
  });

  it('sets timeSpanSelection to "date" when cha is "true" and cht2 is absent', () => {
    const result = mapLocationToChartingState({ cha: 'true' }, baseState);
    expect(result.charting.timeSpanSelection).toBe('date');
  });

  it('does not override timeSpanSelection when cht2 is present', () => {
    const result = mapLocationToChartingState({ cha: 'true', cht2: '2024-12-31' }, baseState);
    expect(result.charting.timeSpanSelection).not.toBe('date');
  });

  it('sets aoiActive and aoiSelected to true when cha is "true" and chc is present', () => {
    const result = mapLocationToChartingState({ cha: 'true', chc: 'someCoords' }, baseState);
    expect(result.charting.aoiActive).toBe(true);
    expect(result.charting.aoiSelected).toBe(true);
  });

  it('does not set aoiSelected when chc is absent', () => {
    const result = mapLocationToChartingState({ cha: 'true' }, baseState);
    expect(result.charting.aoiSelected).toBe(false);
  });

  it('sets active, aoiActive, aoiSelected, and timeSpanSelection to "date" when cha is "true" and chc present and cht2 absent', () => {
    const result = mapLocationToChartingState({ cha: 'true', chc: 'coords' }, baseState);
    expect(result.charting.active).toBe(true);
    expect(result.charting.aoiActive).toBe(true);
    expect(result.charting.aoiSelected).toBe(true);
    expect(result.charting.timeSpanSelection).toBe('date');
  });

  it('sets active and aoiActive/aoiSelected but preserves timeSpanSelection when cha "true", chc present, cht2 present', () => {
    const result = mapLocationToChartingState({ cha: 'true', chc: 'coords', cht2: '2024-01-01' }, baseState);
    expect(result.charting.active).toBe(true);
    expect(result.charting.aoiActive).toBe(true);
    expect(result.charting.aoiSelected).toBe(true);
    expect(result.charting.timeSpanSelection).toBe('range');
  });

  it('returns the original state object structure with charting nested', () => {
    const result = mapLocationToChartingState({ cha: 'true' }, baseState);
    expect(result).toHaveProperty('charting');
  });

  it('does not mutate the original stateFromLocationObj', () => {
    const original = { ...baseState, charting: { ...baseState.charting } };
    mapLocationToChartingState({ cha: 'true', chc: 'x', cht2: 'y' }, baseState);
    expect(baseState).toEqual(original);
  });
});

describe('getFormattedMonthAbbrevDates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns formatted dateA and dateB', () => {
    const result = getFormattedMonthAbbrevDates('2024-01-01', '2024-06-30');
    expect(result).toEqual({
      dateA: 'formatted-2024-01-01',
      dateB: 'formatted-2024-06-30',
    });
  });

  it('calls formatDisplayDate with the selected date', () => {
    getFormattedMonthAbbrevDates('2024-01-01', '2024-06-30');
    expect(formatDisplayDate).toHaveBeenCalledWith('2024-01-01');
  });

  it('calls formatDisplayDate with the selectedB date', () => {
    getFormattedMonthAbbrevDates('2024-01-01', '2024-06-30');
    expect(formatDisplayDate).toHaveBeenCalledWith('2024-06-30');
  });

  it('calls formatDisplayDate exactly twice', () => {
    getFormattedMonthAbbrevDates('2024-01-01', '2024-06-30');
    expect(formatDisplayDate).toHaveBeenCalledTimes(2);
  });

  it('handles undefined arguments without throwing', () => {
    expect(() => getFormattedMonthAbbrevDates(undefined, undefined)).not.toThrow();
  });

  it('returns dateA as formatted-undefined when selected is undefined', () => {
    const result = getFormattedMonthAbbrevDates(undefined, undefined);
    expect(result.dateA).toBe('formatted-undefined');
    expect(result.dateB).toBe('formatted-undefined');
  });
});
