import React from 'react';
import PropTypes from 'prop-types';
import lodashDebounce from 'lodash/debounce';
import Checkbox from '../../util/checkbox';
import {
  checkTemperatureUnitConversion, convertPaletteValue,
} from '../../../modules/settings/util';

const sliderWidth = 264;
const thumbsize = 22;

class PaletteThreshold extends React.Component {
  constructor(props) {
    super(props);
    const { start, end, squashed } = props;
    this.state = {
      start,
      end,
      squashed,
      avg: 0,
    };
    this.debounceSetRange = lodashDebounce(props.setRange, 300);
    this.updateSquash = this.updateSquash.bind(this);
    this.updateThreshold = this.updateThreshold.bind(this);
  }

  updateSquash() {
    const {
      setRange, layerId, index, groupName, palette, legend,
    } = this.props;
    const { start, end, squashed } = this.state;
    const isSquashed = !squashed;
    const startIndex = legend.refs[start];
    const endIndex = legend.refs[end];

    setRange(
      layerId,
      parseFloat(palette.entries.refs.indexOf(startIndex)),
      parseFloat(palette.entries.refs.indexOf(endIndex)),
      isSquashed,
      index,
      groupName,
    );
    this.setState({ squashed: isSquashed });
  }

  /**
   * Update threshold values
   * @param {Array} thresholdArray | Array of start/end indexes for colormap
   */
  updateThreshold(thresholdArray) {
    const {
      layerId, index, groupName, palette, legend,
    } = this.props;
    const { start, end, squashed } = this.state;
    const newStart = parseInt(thresholdArray[0], 10);
    const newEnd = parseInt(thresholdArray[1], 10);
    const startRef = legend.refs[newStart];
    const endRef = legend.refs[newEnd];

    // Update local state on every range-selector change but debounce threshold model update
    if (newStart !== start && newEnd !== end) {
      this.setState({
        start: newStart,
        end: newEnd,
        avg: Math.round((newStart + newEnd) / 2),
      });
    } else if (newStart !== start) {
      this.setState({
        start: newStart,
        avg: Math.round((newStart + end) / 2),
      });
    } else if (newEnd !== end) {
      this.setState({
        end: newEnd,
        avg: Math.round((start + newEnd) / 2),
      });
    } else {
      return;
    }

    const { entries: { refs } } = palette;
    const min = parseFloat(refs.indexOf(startRef));
    const max = parseFloat(refs.lastIndexOf(endRef));

    this.debounceSetRange(
      layerId,
      min,
      max,
      squashed,
      index,
      groupName,
    );
  }

  updateStartThreshold(value) {
    const { end } = this.state;
    const clampedValue = Math.min(value, end - 1);
    this.updateThreshold([clampedValue, end]);
  }

  updateEndThreshold(value) {
    const { start } = this.state;
    const clampedValue = Math.max(value, start + 1);
    this.updateThreshold([start, clampedValue]);
  }

  render() {
    const {
      start, end, squashed, avg,
    } = this.state;
    const {
      index, min, max, legend, globalTemperatureUnit,
    } = this.props;

    const units = legend.units || '';
    const { needsConversion, legendTempUnit } = checkTemperatureUnitConversion(units, globalTemperatureUnit);
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
            onCheck={this.updateSquash}
          />
        </div>
        <div
          id={`wv-layer-options-threshold${index}`}
          className="wv-layer-options-threshold"
        >
          <input
            className="double-range form-range start-range palette-threshold-range"
            style={styles.min}
            name="min"
            type="range"
            min={min}
            max={avg}
            value={start}
            onChange={(e) => this.updateStartThreshold(Math.ceil(parseFloat(e.target.value, 10)))}
          />
          <input
            className="double-range form-range end-range palette-threshold-range"
            style={styles.max}
            name="max"
            type="range"
            min={avg}
            max={max}
            value={end}
            onChange={(e) => this.updateEndThreshold(Math.ceil(parseFloat(e.target.value, 10)))}
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
  }
}
PaletteThreshold.propTypes = {
  end: PropTypes.number,
  groupName: PropTypes.string,
  index: PropTypes.number,
  layerId: PropTypes.string,
  legend: PropTypes.object,
  globalTemperatureUnit: PropTypes.string,
  max: PropTypes.number,
  min: PropTypes.number,
  palette: PropTypes.object,
  setRange: PropTypes.func,
  squashed: PropTypes.bool,
  start: PropTypes.number,
};

export default PaletteThreshold;
