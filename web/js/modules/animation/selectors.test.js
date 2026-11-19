import getAnimationFrames, { MAX_FRAMES } from './selectors';
import util from '../../util/util';
import { subdailyLayersActive } from '../layers/selectors';
import { formatDisplayDate, getValidDateRanges } from '../date/util';

jest.mock('../../util/util', () => ({
  dateAdd: jest.fn((date) => {
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    return next;
  }),
}));

jest.mock('../layers/selectors', () => ({
  subdailyLayersActive: jest.fn(() => false),
}));

jest.mock('../date/util', () => ({
  formatDisplayDate: jest.fn((date) => date.toISOString()),
  getValidDateRanges: jest.fn(() => []),
}));

jest.mock('../date/constants', () => ({
  TIME_SCALE_FROM_NUMBER: {
    1: 'day',
    2: 'month',
  },
}));

const buildState = (overrides = {}) => ({
  animation: { speed: 10 },
  date: {
    customInterval: 1,
    interval: 1,
    customDelta: null,
    delta: 1,
    customSelected: false,
    autoSelected: false,
    ...overrides.date,
  },
  layers: { active: { layers: [] } },
  ...overrides,
});

const buildOptions = (overrides = {}) => ({
  showDates: true,
  startDate: '2023-01-01',
  endDate: '2023-01-03',
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  util.dateAdd.mockImplementation((date) => {
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    return next;
  });
});

describe('getAnimationFrames', () => {
  test('returns one frame per date in the range', () => {
    const result = getAnimationFrames(buildOptions(), buildState());
    expect(result).toHaveLength(3);
  });

  test('each frame has date, text and delay', () => {
    const [frame] = getAnimationFrames(buildOptions(), buildState());
    expect(frame.date).toBeInstanceOf(Date);
    expect(frame).toHaveProperty('text');
    expect(frame).toHaveProperty('delay');
  });

  test('frames advance in date order', () => {
    const result = getAnimationFrames(buildOptions(), buildState());
    expect(result[0].date < result[1].date).toBe(true);
    expect(result[1].date < result[2].date).toBe(true);
  });

  test('does not build imagery URLs', () => {
    const [frame] = getAnimationFrames(buildOptions(), buildState());
    expect(frame).not.toHaveProperty('src');
  });

  test('delay is calculated from animation speed', () => {
    const result = getAnimationFrames(buildOptions(), buildState());
    expect(result[0].delay).toBe(100);
  });

  test('text is the formatted date when showDates is true', () => {
    const result = getAnimationFrames(buildOptions({ showDates: true }), buildState());
    expect(result[0].text).toBe(new Date('2023-01-01').toISOString());
  });

  test('text is empty when showDates is false', () => {
    const result = getAnimationFrames(buildOptions({ showDates: false }), buildState());
    expect(result[0].text).toBe('');
  });

  test('returns a single frame when startDate equals endDate', () => {
    const result = getAnimationFrames(
      buildOptions({ startDate: '2023-01-01', endDate: '2023-01-01' }),
      buildState(),
    );
    expect(result).toHaveLength(1);
  });

  test(`returns false when frame count exceeds ${MAX_FRAMES}`, () => {
    const result = getAnimationFrames(
      buildOptions({ startDate: '2023-01-01', endDate: '2023-06-01' }),
      buildState(),
    );
    expect(result).toBe(false);
  });

  test(`allows exactly ${MAX_FRAMES} frames`, () => {
    const endDate = new Date('2023-01-01');
    endDate.setDate(endDate.getDate() + MAX_FRAMES - 1);
    const result = getAnimationFrames(
      buildOptions({ startDate: '2023-01-01', endDate: endDate.toISOString() }),
      buildState(),
    );
    expect(result).toHaveLength(MAX_FRAMES);
  });

  test('uses customDelta when customSelected is true', () => {
    const state = buildState({
      date: {
        customInterval: 1,
        interval: 1,
        customDelta: 5,
        delta: 1,
        customSelected: true,
        autoSelected: false,
      },
    });
    getAnimationFrames(buildOptions(), state);
    expect(util.dateAdd).toHaveBeenCalledWith(expect.any(Date), 'day', 5);
  });

  test('uses delta when customSelected is false', () => {
    const state = buildState({
      date: {
        customInterval: 1,
        interval: 1,
        customDelta: null,
        delta: 3,
        customSelected: false,
        autoSelected: false,
      },
    });
    getAnimationFrames(buildOptions(), state);
    expect(util.dateAdd).toHaveBeenCalledWith(expect.any(Date), 'day', 3);
  });

  test('steps to each date range start when autoSelected is true', () => {
    getValidDateRanges.mockReturnValueOnce([
      { startDate: '2023-01-01T00:07:00Z', endDate: '2023-01-01T00:59:00Z' },
      { startDate: '2023-01-01T01:07:00Z', endDate: '2023-01-01T01:59:00Z' },
    ]);
    const state = buildState({
      date: {
        customInterval: 1,
        interval: 1,
        customDelta: null,
        delta: 1,
        customSelected: false,
        autoSelected: true,
      },
    });
    const result = getAnimationFrames(buildOptions(), state);
    expect(result.map(({ date }) => date.toISOString())).toEqual([
      new Date('2023-01-01T00:07:00Z').toISOString(),
      new Date('2023-01-01T01:07:00Z').toISOString(),
    ]);
  });

  test('passes subdaily flag to formatDisplayDate', () => {
    subdailyLayersActive.mockReturnValueOnce(true);
    getAnimationFrames(buildOptions(), buildState());
    expect(formatDisplayDate).toHaveBeenCalledWith(expect.any(Date), true);
  });
});
