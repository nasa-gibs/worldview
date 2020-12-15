import React from 'react';
import PropTypes from 'prop-types';
import lodashDebounce from 'lodash/debounce';
import { Range as RangeInput } from 'rc-slider';
import Checkbox from '../../util/checkbox';

class PaletteThreshold extends React.Component {
  constructor(props) {
    super(props);
    const { start, end, squashed } = props;
    this.state = {
      start,
      end,
      squashed,
    };
    this.debounceSetRange = lodashDebounce(props.setRange, 300);
    this.updateSquash = this.updateSquash.bind(this);
    this.updateThreshold = this.updateThreshold.bind(this);
  }

  /**
   * Apply squash
   * @param {Boolean} boo
   */
  updateSquash(boo) {
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
   * @param {Array} thresholdArray | Array of start/end indexs for colormap
   */
  updateThreshold(thresholdArray) {
    const {
      layerId, index, groupName, palette, legend,
    } = this.props;
    const { start, end, squashed } = this.state;
    const newStart = Math.ceil(Number(thresholdArray[0]));
    const newEnd = Math.ceil(Number(thresholdArray[1]));
    const startRef = legend.refs[newStart];
    const endRef = legend.refs[newEnd];
    if (newStart !== start && newEnd !== end) {
      this.setState({
        start: newStart,
        end: newEnd,
      });
    } else if (newStart !== start) {
      this.setState({
        start: newStart,
      });
    } else if (newEnd !== end) {
      this.setState({
        end: newEnd,
      });
    } else {
      return;
    }
    // Update local state on every range-selector change but debounce threshold model update

    this.debounceSetRange(
      layerId,
      parseFloat(palette.entries.refs.indexOf(startRef)),
      parseFloat(palette.entries.refs.indexOf(endRef)),
      squashed,
      index,
      groupName,
    );
  }

  render() {
    const { start, end, squashed } = this.state;
    const {
      index, min, max, legend,
    } = this.props;
    const units = legend.units || '';
    const startLabel = start === 0 && legend.minLabel
      ? `${legend.minLabel} ${units}`
      : `${legend.tooltips[start]} ${units}`;
    const endLabel = end === legend.tooltips.length - 1 && legend.maxLabel
      ? `${legend.maxLabel} ${units}`
      : `${legend.tooltips[end]} ${units}`;

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
          <RangeInput
            defaultValue={[start, end]}
            min={min}
            max={max}
            onChange={this.updateThreshold}
          />
          <div className="wv-label">
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
  max: PropTypes.number,
  min: PropTypes.number,
  palette: PropTypes.object,
  setRange: PropTypes.func,
  squashed: PropTypes.bool,
  start: PropTypes.number,
};

export default PaletteThreshold;
