import { isValidCoordinates, getNormalizedCoordinate, getFormattedCoordinates } from './util';
import util from '../../util/util';

jest.mock('../../util/util', () => ({
  getCoordinateFormat: jest.fn(() => 'latlon-dd'),
  formatCoordinate: jest.fn((coord) => `${coord[1]}, ${coord[0]}`),
}));

describe('isValidCoordinates', () => {
  test('returns a truthy CoordinateParser object for valid decimal degree coordinates', () => {
    const result = isValidCoordinates('34.05, -118.24');
    expect(result).toBeTruthy();
  });

  test('returns a truthy object for DMS coordinates', () => {
    const result = isValidCoordinates('34°3\'0"N 118°14\'24"W');
    expect(result).toBeTruthy();
  });

  test('returns false for empty string', () => {
    expect(isValidCoordinates('')).toBe(false);
  });

  test('returns false for plain text', () => {
    expect(isValidCoordinates('New York')).toBe(false);
  });

  test('returns false for a single number', () => {
    expect(isValidCoordinates('45')).toBe(false);
  });

  test('returns false for unparseable partial input', () => {
    expect(isValidCoordinates('34.')).toBe(false);
  });
});

describe('getNormalizedCoordinate', () => {
  test('returns unchanged coordinates when longitude is within [-180, 180]', () => {
    expect(getNormalizedCoordinate([-118.24, 34.05])).toEqual([-118.24, 34.05]);
  });

  test('returns unchanged coordinates for longitude exactly at 180', () => {
    expect(getNormalizedCoordinate([180, 0])).toEqual([180, 0]);
  });

  test('normalizes longitude greater than 180', () => {
    const [lon] = getNormalizedCoordinate([200, 10]);
    expect(lon).toBeCloseTo(-160);
  });

  test('normalizes negative longitude less than -180', () => {
    const [lon] = getNormalizedCoordinate([-200, 10]);
    expect(lon).toBeCloseTo(160);
  });

  test('normalizes longitude of 360 to 0', () => {
    const [lon] = getNormalizedCoordinate([360, 0]);
    expect(lon).toBeCloseTo(0);
  });

  test('preserves latitude unchanged', () => {
    const [, lat] = getNormalizedCoordinate([200, 45]);
    expect(lat).toBe(45);
  });
});

describe('getFormattedCoordinates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    util.getCoordinateFormat.mockReturnValue('latlon-dd');
    util.formatCoordinate.mockImplementation((coord) => `${coord[1]}, ${coord[0]}`);
  });

  test('calls util.formatCoordinate with normalized, fixed coordinates', () => {
    getFormattedCoordinates([34.05678, -118.24567]);
    expect(util.formatCoordinate).toHaveBeenCalledWith(
      [-118.2457, 34.0568],
      'latlon-dd',
    );
  });

  test('returns formatted string from util.formatCoordinate', () => {
    util.formatCoordinate.mockReturnValue('34.0568, -118.2457');
    const result = getFormattedCoordinates([34.05678, -118.24567]);
    expect(result).toBe('34.0568, -118.2457');
  });

  test('normalizes longitude before formatting', () => {
    // input: [latitude=10, longitude=200] — lon 200 should normalize to -160
    getFormattedCoordinates([10, 200]);
    expect(util.formatCoordinate.mock.calls[0][0][0]).toBeCloseTo(-160);
  });

  test('truncates coordinates to 4 decimal places', () => {
    // input: [latitude, longitude]
    getFormattedCoordinates([34.123456789, -118.987654321]);
    expect(util.formatCoordinate.mock.calls[0][0][0]).toBe(-118.9877);
    expect(util.formatCoordinate.mock.calls[0][0][1]).toBe(34.1235);
  });
});
