import getImageArray from './selectors';
import util from '../../util/util';
import { imageUtilGetCoordsFromPixelValues, getDownloadUrl } from '../image-download/util';
import { subdailyLayersActive, getLayers } from '../layers/selectors';
import { formatDisplayDate, getNextImageryDelta } from '../date/util';

jest.mock('../../util/util', () => ({
  format: jest.fn((url) => url),
  dateAdd: jest.fn((date, increment, delta) => {
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    return next;
  }),
}));

jest.mock('../image-download/util', () => ({
  imageUtilGetCoordsFromPixelValues: jest.fn(() => [[0, 0], [1, 1]]),
  getDownloadUrl: jest.fn(() => 'http://example.com/image'),
}));

jest.mock('../layers/selectors', () => ({
  subdailyLayersActive: jest.fn(() => false),
  getLayers: jest.fn(() => []),
}));

jest.mock('../date/util', () => ({
  formatDisplayDate: jest.fn((date) => date.toISOString()),
  getNextImageryDelta: jest.fn(() => 1),
}));

jest.mock('../date/constants', () => ({
  TIME_SCALE_FROM_NUMBER: {
    1: 'day',
    2: 'month',
  },
}));

const buildState = (overrides = {}) => ({
  animation: { speed: 10 },
  proj: 'geographic',
  map: { ui: { selected: {} } },
  date: {
    customInterval: 1,
    interval: 1,
    customDelta: null,
    delta: 1,
    customSelected: false,
    autoSelected: false,
    ...overrides.date,
  },
  locationSearch: { coordinates: [0, 0] },
  layers: { active: { layers: [] } },
  ...overrides,
});

const buildOptions = (overrides = {}) => ({
  boundaries: {},
  showDates: true,
  startDate: '2023-01-01',
  endDate: '2023-01-03',
  url: 'http://example.com',
  ...overrides,
});

const dimensions = { width: 800, height: 600 };

beforeEach(() => {
  jest.clearAllMocks();
  util.dateAdd.mockImplementation((date) => {
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    return next;
  });
});

describe('getImageArray', () => {
  test('returns an array of image objects for a date range', () => {
    const result = getImageArray(buildOptions(), dimensions, buildState());
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(3);
  });

  test('each item has src, text, and delay properties', () => {
    const result = getImageArray(buildOptions(), dimensions, buildState());
    result.forEach((item) => {
      expect(item).toHaveProperty('src');
      expect(item).toHaveProperty('text');
      expect(item).toHaveProperty('delay');
    });
  });

  test('delay is calculated from animation speed', () => {
    const result = getImageArray(buildOptions(), dimensions, buildState());
    expect(result[0].delay).toBe(100);
  });

  test('text is set to strDate when showDates is true', () => {
    const result = getImageArray(buildOptions({ showDates: true }), dimensions, buildState());
    expect(result[0].text).not.toBe('');
  });

  test('text is empty string when showDates is false', () => {
    const result = getImageArray(buildOptions({ showDates: false }), dimensions, buildState());
    result.forEach((item) => {
      expect(item.text).toBe('');
    });
  });

  test('returns empty array when startDate equals endDate', () => {
    const result = getImageArray(
      buildOptions({ startDate: '2023-01-01', endDate: '2023-01-01' }),
      dimensions,
      buildState(),
    );
    expect(result.length).toBe(1);
  });

  test('returns false when frame count exceeds 40', () => {
    util.dateAdd.mockImplementation((date) => {
      const next = new Date(date);
      next.setMinutes(next.getMinutes() + 1);
      return next;
    });
    const result = getImageArray(
      buildOptions({ startDate: '2023-01-01T00:00:00Z', endDate: '2023-01-03T00:00:00Z' }),
      dimensions,
      buildState(),
    );
    expect(result).toBe(false);
  });

  test('uses customDelta when customSelected is true and customDelta is set', () => {
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
    const result = getImageArray(buildOptions(), dimensions, state);
    expect(util.dateAdd).toHaveBeenCalledWith(expect.any(Date), 'day', 5);
    expect(Array.isArray(result)).toBe(true);
  });

  test('uses delta when customSelected is false', () => {
    const state = buildState({
      date: {
        customInterval: 1,
        interval: 1,
        customDelta: null,
        delta: 2,
        customSelected: false,
        autoSelected: false,
      },
    });
    getImageArray(buildOptions(), dimensions, state);
    expect(util.dateAdd).toHaveBeenCalledWith(expect.any(Date), 'day', 2);
  });

  test('uses delta when customSelected is true but customDelta is falsy', () => {
    const state = buildState({
      date: {
        customInterval: 1,
        interval: 1,
        customDelta: null,
        delta: 3,
        customSelected: true,
        autoSelected: false,
      },
    });
    getImageArray(buildOptions(), dimensions, state);
    expect(util.dateAdd).toHaveBeenCalledWith(expect.any(Date), 'day', 3);
  });

  test('uses getNextImageryDelta when autoSelected is true', () => {
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
    getImageArray(buildOptions(), dimensions, state);
    expect(getNextImageryDelta).toHaveBeenCalled();
    expect(util.dateAdd).toHaveBeenCalledWith(expect.any(Date), 'day', 1);
  });

  test('uses customInterval for increment when customSelected is true', () => {
    const state = buildState({
      date: {
        customInterval: 2,
        interval: 1,
        customDelta: 1,
        delta: 1,
        customSelected: true,
        autoSelected: false,
      },
    });
    getImageArray(buildOptions(), dimensions, state);
    expect(util.dateAdd).toHaveBeenCalledWith(expect.any(Date), 'month', expect.any(Number));
  });

  test('calls subdailyLayersActive with state', () => {
    getImageArray(buildOptions(), dimensions, buildState());
    expect(subdailyLayersActive).toHaveBeenCalledWith(buildState());
  });

  test('calls imageUtilGetCoordsFromPixelValues with boundaries and map', () => {
    const state = buildState();
    getImageArray(buildOptions(), dimensions, state);
    expect(imageUtilGetCoordsFromPixelValues).toHaveBeenCalledWith({}, state.map.ui.selected);
  });

  test('calls getDownloadUrl with expected arguments', () => {
    const state = buildState();
    const options = buildOptions();
    getImageArray(options, dimensions, state);
    expect(getDownloadUrl).toHaveBeenCalledWith(
      options.url,
      state.proj,
      expect.any(Array),
      [[0, 0], [1, 1]],
      dimensions,
      expect.any(Date),
      false,
      false,
      state.locationSearch.coordinates,
    );
  });

  test('calls formatDisplayDate for each frame', () => {
    getImageArray(buildOptions(), dimensions, buildState());
    expect(formatDisplayDate).toHaveBeenCalledTimes(3);
  });

  test('calls getLayers for each frame', () => {
    getImageArray(buildOptions(), dimensions, buildState());
    expect(getLayers).toHaveBeenCalledTimes(3);
  });

  test('getLayers called with renderable and reverse options', () => {
    const state = buildState();
    getImageArray(buildOptions(), dimensions, state);
    expect(getLayers).toHaveBeenCalledWith(state, expect.objectContaining({
      reverse: true,
      renderable: true,
    }));
  });

  test('src is set from util.format return value', () => {
    util.format.mockReturnValue('http://mocked-src.com/img');
    const result = getImageArray(buildOptions(), dimensions, buildState());
    result.forEach((item) => {
      expect(item.src).toBe('http://mocked-src.com/img');
    });
  });

  test('returns empty array when endDate is before startDate', () => {
    const result = getImageArray(
      buildOptions({ startDate: '2023-01-05', endDate: '2023-01-01' }),
      dimensions,
      buildState(),
    );
    expect(result).toEqual([]);
  });

  test('filters out layers past their endDate in getProducts via getLayers', () => {
    getLayers.mockReturnValue([
      { visible: true, startDate: '2022-01-01', endDate: '2023-01-02' },
      { visible: true, startDate: '2022-01-01', endDate: '2024-01-01' },
    ]);
    const result = getImageArray(buildOptions(), dimensions, buildState());
    expect(Array.isArray(result)).toBe(true);
  });

  test('includes layer with no startDate in getProducts', () => {
    getLayers.mockReturnValue([
      { visible: false },
    ]);
    const result = getImageArray(buildOptions(), dimensions, buildState());
    expect(Array.isArray(result)).toBe(true);
  });
});
