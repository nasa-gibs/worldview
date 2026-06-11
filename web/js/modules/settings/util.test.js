import {
  unitConvert,
  convertPaletteValue,
} from './util';

test('is unitConvert successfully converting units', () => {
  const actual = unitConvert(32, 'Fahrenheit', 'Celsius');
  expect(actual).toBe(0);
});

test('is convertPaletteValue returning the correct string', () => {
  const actual = convertPaletteValue('32', 'Fahrenheit', 'Celsius');
  expect(actual).toBe('0.00 °C');
});
