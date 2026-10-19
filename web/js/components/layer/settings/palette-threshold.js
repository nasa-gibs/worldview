import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import lodashDebounce from 'lodash/debounce';
import Checkbox from '../../util/checkbox';
import {
  checkTemperatureUnitConversion, convertPaletteValue,
} from '../../../modules/settings/util';

const thumbsize = 26;

const PaletteThreshold = ({
  start: startProp,
  end: endProp,
  squashed: squashedProp,
  noclipped: noclippedProp,
  setRange,
  layerId,
  index,
  groupName,
  palette,
  legend,
  min,
  max,
  globalTemperatureUnit,
}) => {
  const [start, setStart] = useState(startProp);
  const [end, setEnd] = useState(endProp);
  const [squashed, setSquashed] = useState(squashedProp);
  const [noclipped, setNoclipped] = useState(noclippedProp);
  const [avg, setAvg] = useState(Math.round((startProp + endProp) / 2));
  const [sliderWidth, setSliderWidth] = useState(264);

  const sliderRef = useRef(null);
  const debouncedSetRange = useRef(lodashDebounce(setRange, 300)).current;

  useEffect(() => {
    if (sliderRef.current?.offsetWidth > 0 && sliderRef.current.offsetWidth !== sliderWidth) {
      setSliderWidth(sliderRef.current.offsetWidth);
    }
  });

  function updateSquashOrNoClip(type) {
    const isSquashed = type === 'squash' ? !squashed : squashed;
    const isNoClipped = type === 'noclip' ? !noclipped : noclipped;
    const startIndex = legend.refs[start];
    const endIndex = legend.refs[end];

    setRange(
      layerId,
      parseFloat(palette.entries.refs.indexOf(startIndex)),
      parseFloat(palette.entries.refs.lastIndexOf(endIndex)),
      isSquashed,
      isNoClipped,
      index,
      groupName,
    );
    if (type === 'squash') {
      setSquashed(isSquashed);
    } else {
      setNoclipped(isNoClipped);
    }
  }

  function updateThreshold(thresholdArray) {
    const newStart = parseInt(thresholdArray[0], 10);
    const newEnd = parseInt(thresholdArray[1], 10);
    const startRef = legend.refs[newStart];
    const endRef = legend.refs[newEnd];
    const newAvg = Math.round((newStart + newEnd) / 2);

    if (newStart !== start && newEnd !== end) {
      setStart(newStart);
      setEnd(newEnd);
      setAvg(newAvg);
    } else if (newStart !== start) {
      setStart(newStart);
      setAvg(newAvg);
    } else if (newEnd !== end) {
      setEnd(newEnd);
      setAvg(newAvg);
    } else {
      return;
    }

    const { entries: { refs } } = palette;
    const minVal = parseFloat(refs.indexOf(startRef));
    const maxVal = parseFloat(refs.lastIndexOf(endRef));

    debouncedSetRange(
      layerId,
      minVal,
      maxVal,
      squashed,
      noclipped,
      index,
      groupName,
    );
  }

  function updateStartThreshold(value) {
    const clampedValue = Math.min(value, end - 1);
    updateThreshold([clampedValue, end]);
  }

  function updateEndThreshold(value) {
    const clampedValue = Math.max(value, start + 1);
    updateThreshold([start, clampedValue]);
  }

  const units = legend.units || '';
  const {
    needsConversion,
    legendTempUnit,
  } = checkTemperatureUnitConversion(units, globalTemperatureUnit);
  let startLabel = start === 0 && legend.minLabel
    ? legend.minLabel
    : legend.tooltips[start];
  let endLabel = end === legend.tooltips.length - 1 && legend.maxLabel
    ? legend.maxLabel
    : legend.tooltips[end];

  if (needsConversion) {
    const parsedMin = convertPaletteValue(startLabel, legendTempUnit, globalTemperatureUnit);
    const parsedMax = convertPaletteValue(endLabel, legendTempUnit, globalTemperatureUnit);
    startLabel = parsedMin;
    endLabel = parsedMax;
  } else {
    startLabel += ` ${units}`;
    endLabel += ` ${units}`;
  }

  const minWidth = thumbsize + ((avg - min) / (max - min)) * (sliderWidth - (2 * thumbsize));
  const maxWidth = thumbsize + ((max - avg) / (max - min)) * (sliderWidth - (2 * thumbsize));
  const minPercent = ((start - min) / (avg - min)) * 100;
  const maxPercent = ((end - avg) / (max - avg)) * 100;
  const styles = {
    min: {
      width: minWidth,
      left: 0,
      '--min-range-percent': `${minPercent}%`,
    },
    max: {
      width: maxWidth,
      left: minWidth,
      '--max-range-percent': `${maxPercent}%`,
    },
  };

  return (
    <div className="layer-threshold-select settings-component">
      <h2 className="wv-header">Thresholds</h2>
      <div id={`wv-palette-squash${index}`} className="wv-palette-squash">
        <Checkbox
          name="Squash Palette"
          color="gray"
          checked={squashed}
          label="Squash Palette"
          classNames="wv-squash-button-check"
          id={`wv-squash-button-check${index}`}
          onCheck={() => updateSquashOrNoClip('squash')}
        />
      </div>
      <div id={`wv-palette-clip${index}`} className="wv-palette-clip">
        <Checkbox
          name="Clip Palette"
          color="gray"
          checked={!noclipped}
          label="Clip Palette"
          classNames="wv-clip-button-check"
          id={`wv-clip-button-check${index}`}
          onCheck={() => updateSquashOrNoClip('noclip')}
        />
      </div>
      <div
        id={`wv-layer-options-threshold${index}`}
        className="wv-layer-options-threshold"
        ref={sliderRef}
      >
        <input
          className="double-range form-range start-range palette-threshold-range"
          style={styles.min}
          name="min"
          type="range"
          min={min}
          max={avg}
          value={start}
          onChange={(e) => updateStartThreshold(Math.ceil(parseFloat(e.target.value, 10)))}
        />
        <input
          className="double-range form-range end-range palette-threshold-range"
          style={styles.max}
          name="max"
          type="range"
          min={avg}
          max={max}
          value={end}
          onChange={(e) => updateEndThreshold(Math.ceil(parseFloat(e.target.value, 10)))}
        />
        <div className="wv-label mt-3">
          <span className="wv-label-range-min wv-label-range">
            {startLabel}
          </span>
          <span className="wv-label-range-max wv-label-range">
            {endLabel}
          </span>
        </div>
      </div>
    </div>
  );
};
PaletteThreshold.propTypes = {
  end: PropTypes.number,
  groupName: PropTypes.string,
  index: PropTypes.number,
  layerId: PropTypes.string,
  legend: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  globalTemperatureUnit: PropTypes.string,
  max: PropTypes.number,
  min: PropTypes.number,
  palette: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  setRange: PropTypes.func,
  squashed: PropTypes.bool,
  noclipped: PropTypes.bool,
  start: PropTypes.number,
};

export default PaletteThreshold;
