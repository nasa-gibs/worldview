import tConverter from '@khanisak/temperature-converter';

// fix package specific spelling
const celsiusSpellFix = (unit) => (unit === 'Celsius' ? 'Celcius' : unit);

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
  const result = tConverter.convert(
    value,
    tConverter.unit[celsiusSpellFix(initialUnit)],
    tConverter.unit[celsiusSpellFix(targetUnit)],
  );
  return result;
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
  let prefix = '';
  let convertedValue;
  const isDash = val.includes(' – ');
  const splitCharacter = isDash
    ? '–'
    : '';

  // Range value (ex: '186.2 – 186.9')
  if (splitCharacter) {
    let [minRangeVal, maxRangeVal] = val.split(` ${splitCharacter} `);

    let minPrefix = '';
    let maxPrefix = '';
    const minRangeSplit = minRangeVal.split(' ');
    const maxRangeSplit = maxRangeVal.split(' ');
    if (minRangeSplit.length > 1) { // (ex: '< 180.0')
      [minPrefix, minRangeVal] = minRangeSplit;
      minPrefix = `${minPrefix} `;
    }
    if (maxRangeSplit.length > 1) {
      [maxPrefix, maxRangeVal] = maxRangeSplit;
      maxPrefix = `${maxPrefix} `;
    }

    const minConvert = unitConvert(Number(minRangeVal), initialUnit, targetUnit).toFixed(2);
    const maxConvert = unitConvert(Number(maxRangeVal), initialUnit, targetUnit).toFixed(2);
    convertedValue = `${minPrefix}${minConvert} ${splitCharacter} ${maxPrefix}${maxConvert} ${newUnitAbbrev}`;
  } else {
    // Single value (ex: '180.0', '< 180.0')
    const valSplit = val.split(' ');
    let singleVal = val;
    if (valSplit.length > 1) { // (ex: '< 180.0')
      [prefix, singleVal] = valSplit;
      prefix = `${prefix} `;
    }

    const valConvert = unitConvert(Number(singleVal), initialUnit, targetUnit).toFixed(2);
    convertedValue = `${prefix}${valConvert} ${newUnitAbbrev}`;
  }
  return convertedValue;
}
