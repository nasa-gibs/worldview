import {
  unitConvert,
  convertPaletteValue,
  getTemperatureUnitFromAbbrev,
  getAbbrevFromTemperatureUnit,
  checkTemperatureUnitConversion,
} from './util';

describe('getTemperatureUnitFromAbbrev', () => {
  test('returns Kelvin for K', () => {
    expect(getTemperatureUnitFromAbbrev('K')).toBe('Kelvin');
  });

  test('returns Celsius for °C', () => {
    expect(getTemperatureUnitFromAbbrev('°C')).toBe('Celsius');
  });

  test('returns Fahrenheit for °F', () => {
    expect(getTemperatureUnitFromAbbrev('°F')).toBe('Fahrenheit');
  });

  test('returns undefined for unknown abbreviation', () => {
    expect(getTemperatureUnitFromAbbrev('X')).toBeUndefined();
  });
});

describe('getAbbrevFromTemperatureUnit', () => {
  test('returns K for Kelvin', () => {
    expect(getAbbrevFromTemperatureUnit('Kelvin')).toBe('K');
  });

  test('returns °C for Celsius', () => {
    expect(getAbbrevFromTemperatureUnit('Celsius')).toBe('°C');
  });

  test('returns °F for Fahrenheit', () => {
    expect(getAbbrevFromTemperatureUnit('Fahrenheit')).toBe('°F');
  });

  test('returns undefined for unknown unit', () => {
    expect(getAbbrevFromTemperatureUnit('Unknown')).toBeUndefined();
  });
});

describe('unitConvert', () => {
  test('converts Fahrenheit to Celsius', () => {
    expect(unitConvert(32, 'Fahrenheit', 'Celsius')).toBe(0);
  });

  test('converts Celsius to Fahrenheit', () => {
    expect(unitConvert(0, 'Celsius', 'Fahrenheit')).toBe(32);
  });

  test('converts Celsius to Kelvin', () => {
    expect(unitConvert(0, 'Celsius', 'Kelvin')).toBe(273.15);
  });

  test('converts Fahrenheit to Kelvin', () => {
    expect(unitConvert(32, 'Fahrenheit', 'Kelvin')).toBeCloseTo(273.15, 1);
  });

  test('converts Kelvin to Celsius', () => {
    expect(unitConvert(273.15, 'Kelvin', 'Celsius')).toBeCloseTo(0, 1);
  });

  test('converts Kelvin to Fahrenheit', () => {
    expect(unitConvert(273.15, 'Kelvin', 'Fahrenheit')).toBeCloseTo(32, 1);
  });

  test('returns undefined for unknown initialUnit', () => {
    expect(unitConvert(100, 'Unknown', 'Celsius')).toBeUndefined();
  });

  test('returns undefined when initialUnit is Celsius but targetUnit is unknown', () => {
    expect(unitConvert(100, 'Celsius', 'Unknown')).toBeUndefined();
  });

  test('returns undefined when initialUnit is Fahrenheit but targetUnit is unknown', () => {
    expect(unitConvert(100, 'Fahrenheit', 'Unknown')).toBeUndefined();
  });

  test('returns undefined when initialUnit is Kelvin but targetUnit is unknown', () => {
    expect(unitConvert(100, 'Kelvin', 'Unknown')).toBeUndefined();
  });
});

describe('checkTemperatureUnitConversion', () => {
  test('needsConversion is true when units differ', () => {
    const result = checkTemperatureUnitConversion('°C', 'Fahrenheit');
    expect(result.needsConversion).toBe(true);
  });

  test('needsConversion is false when units are the same', () => {
    const result = checkTemperatureUnitConversion('°C', 'Celsius');
    expect(result.needsConversion).toBe(false);
  });

  test('needsConversion is false when legendTempUnit is undefined (unknown abbrev)', () => {
    const result = checkTemperatureUnitConversion('X', 'Celsius');
    expect(result.needsConversion).toBe(false);
  });

  test('needsConversion is false when globalTemperatureUnit is falsy', () => {
    const result = checkTemperatureUnitConversion('°C', '');
    expect(result.needsConversion).toBe(false);
  });

  test('needsConversion is false when both units and globalTemperatureUnit are falsy', () => {
    const result = checkTemperatureUnitConversion('', '');
    expect(result.needsConversion).toBe(false);
  });

  test('returns correct legendTempUnit', () => {
    const result = checkTemperatureUnitConversion('K', 'Celsius');
    expect(result.legendTempUnit).toBe('Kelvin');
  });

  test('returns undefined legendTempUnit for unknown abbreviation', () => {
    const result = checkTemperatureUnitConversion('Z', 'Celsius');
    expect(result.legendTempUnit).toBeUndefined();
  });

  test('needsConversion is true when Kelvin abbrev differs from globalTemperatureUnit Fahrenheit', () => {
    const result = checkTemperatureUnitConversion('K', 'Fahrenheit');
    expect(result.needsConversion).toBe(true);
  });
});

describe('convertPaletteValue', () => {
  test('converts a single value from Fahrenheit to Celsius', () => {
    expect(convertPaletteValue('32', 'Fahrenheit', 'Celsius')).toBe('0.00 °C');
  });

  test('converts a single value from Celsius to Fahrenheit', () => {
    expect(convertPaletteValue('0', 'Celsius', 'Fahrenheit')).toBe('32.00 °F');
  });

  test('converts a single value from Celsius to Kelvin', () => {
    expect(convertPaletteValue('0', 'Celsius', 'Kelvin')).toBe('273.15 K');
  });

  test('converts a single value from Kelvin to Celsius', () => {
    expect(convertPaletteValue('273.15', 'Kelvin', 'Celsius')).toBe('0.00 °C');
  });

  test('converts a range value (double dash) from Celsius to Fahrenheit', () => {
    expect(convertPaletteValue('0.0 – 100.0', 'Celsius', 'Fahrenheit')).toBe('32.00 – 212.00 °F');
  });

  test('converts a range value from Fahrenheit to Celsius', () => {
    expect(convertPaletteValue('32.0 – 212.0', 'Fahrenheit', 'Celsius')).toBe('0.00 – 100.00 °C');
  });

  test('converts a range value from Kelvin to Fahrenheit', () => {
    const result = convertPaletteValue('273.15 – 373.15', 'Kelvin', 'Fahrenheit');
    expect(result).toMatch(/°F$/);
  });

  test('handles a prefixed single value (e.g. < 180.0)', () => {
    const result = convertPaletteValue('< 32.0', 'Fahrenheit', 'Celsius');
    expect(result).toBe('< 0.00 °C');
  });

  test('handles a prefixed range min value', () => {
    const result = convertPaletteValue('≥ 0.0 – 100.0', 'Celsius', 'Fahrenheit');
    expect(result).toBe('≥ 32.00 – 212.00 °F');
  });

  test('converts a single Kelvin value to Celsius', () => {
    expect(convertPaletteValue('373.15', 'Kelvin', 'Celsius')).toBe('100.00 °C');
  });

  test('converts a range from Celsius to Kelvin', () => {
    const result = convertPaletteValue('0.0 – 100.0', 'Celsius', 'Kelvin');
    expect(result).toBe('273.15 – 373.15 K');
  });
});
