// import tConverter from '@khanisak/temperature-converter';
import { Celcius, Fahrenheit, Kelvin } from '@khanisak/temperature-converter';

export function getTemperatureUnitFromAbbrev(unitAbbrev) {
  const temps = {
    K: 'Kelvin',
    '°C': 'Celsius',
    '°F': 'Fahrenheit',
  };
  return temps[unitAbbrev];
}

export function getAbbrevFromTemperatureUnit(unit) {
  const temps = {
    Kelvin: 'K',
    Celsius: '°C',
    Fahrenheit: '°F',
  };
  return temps[unit];
}

export function unitConvert(value, initialUnit, targetUnit) {
  if (initialUnit === 'Celsius') {
    if (targetUnit === 'Fahrenheit') return new Celcius(value).toFahrenheit().value;
    if (targetUnit === 'Kelvin') return new Celcius(value).toKelvin().value;
  }

  if (initialUnit === 'Fahrenheit') {
    if (targetUnit === 'Celsius') return new Fahrenheit(value).toCelcius().value;
    if (targetUnit === 'Kelvin') return new Fahrenheit(value).toKelvin().value;
  }

  if (initialUnit === 'Kelvin') {
    if (targetUnit === 'Celsius') return new Kelvin(value).toCelcius().value;
    if (targetUnit === 'Fahrenheit') return new Kelvin(value).toFahrenheit().value;
  }
}

export function checkTemperatureUnitConversion(units, globalTemperatureUnit) {
  let needsConversion = false;
  const legendTempUnit = getTemperatureUnitFromAbbrev(units);
  if (legendTempUnit && globalTemperatureUnit && legendTempUnit !== globalTemperatureUnit) {
    needsConversion = true;
  }
  return {
    needsConversion,
    legendTempUnit,
  };
}

/**
 * Parse prefix and value or use defaults
 *
 * @param {String} val (ex: '≥ 32.00')
 * @returns {Array - Strings} prefix, value
 */
const getPrefixAndValue = (val) => {
  let prefix = '';
  let value = val;
  const valSplit = val.split(' ');

  if (valSplit.length > 1) {
    [prefix, value] = valSplit;
    prefix = `${prefix} `;
  }

  return [
    prefix,
    value,
  ];
};

/**
 * Convert palette temperature values based on units
 *
 * Examples val palette value/range arguments:
 * Base single min/max values
 * '180.0 340.0'
 *
 * Base single min/max values with prefix
 * '< 180.0 > 340.0'
 *
 * Double min single max
 * '186.2 – 186.9 340.0'
 *
 * Single min double max
 * '180.0 331.2 – 331.8'
 *
 * Double min double max
 * '195.0 – 195.6 331.2 – 331.8'
 *
 * @param {String} val (ex: '≥ 32.00')
 * @param {String} initialUnit (ex: 'Celsius')
 * @param {String} targetUnit (ex: 'Fahrenheit')
 *
 * @returns {String} converted unit (ex: '39.02 – 39.29 °F')
 */

export function convertPaletteValue(val, initialUnit, targetUnit) {
  const newUnitAbbrev = getAbbrevFromTemperatureUnit(targetUnit || initialUnit);
  let convertedValue;
  const isDash = val.includes(' – ');
  const splitCharacter = isDash
    ? '–'
    : '';

  // Range value (ex: '186.2 – 186.9')
  if (splitCharacter) {
    const [minRangeVal, maxRangeVal] = val.split(` ${splitCharacter} `);

    const [minPrefix, minValue] = getPrefixAndValue(minRangeVal);
    const [maxPrefix, maxValue] = getPrefixAndValue(maxRangeVal);

    const minConvert = unitConvert(Number(minValue), initialUnit, targetUnit).toFixed(2);
    const maxConvert = unitConvert(Number(maxValue), initialUnit, targetUnit).toFixed(2);
    convertedValue = `${minPrefix}${minConvert} ${splitCharacter} ${maxPrefix}${maxConvert} ${newUnitAbbrev}`;
  } else {
    // Single value (ex: '180.0', '< 180.0')
    const [prefix, value] = getPrefixAndValue(val);
    const valueConvert = unitConvert(Number(value), initialUnit, targetUnit).toFixed(2);
    convertedValue = `${prefix}${valueConvert} ${newUnitAbbrev}`;
  }
  return convertedValue;
}
