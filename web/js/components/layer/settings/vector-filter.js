import React from 'react';
import PropTypes from 'prop-types';
import lodashDebounce from 'lodash/debounce';

class VectorFilter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      start: props.start,
      end: props.end,
    };
    this.debounceSetRange = lodashDebounce(props.setFilterRange, 300);
    this.updateFilter = this.updateFilter.bind(this);
  }

  /**
   * Update filter values
   * @param {Array} thresholdArray | Array of start/end indexs for colormap
   */
  updateFilter(thresholdArray) {
    const { layerId, index, groupName } = this.props;
    const { start, end } = this.state;

    const newStart = Math.ceil(Number(thresholdArray[0]));
    const newEnd = Math.ceil(Number(thresholdArray[1]));
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
      parseFloat(newStart),
      parseFloat(newEnd),
      index,
      groupName,
    );
  }

  render() {
    const { start, end } = this.state;
    const { index, min, max } = this.props;
    const startLabel = 0; // Placeholder
    const endLabel = 100; // Placeholder
    return (
      <div className="layer-threshold-select settings-component">
        <h2 className="wv-header">Filters</h2>
        <div
          id={`wv-layer-options-threshold${index}`}
          className="wv-layer-options-threshold"
        >
          <input
            type="range"
            className="form-range"
            defaultValue={end}
            min={min}
            max={max}
            onChange={(e) => this.updateFilter([start, parseInt(e.target.value, 10)])}
            style={{ '--value-percent': `${index}%` }}
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
VectorFilter.propTypes = {
  end: PropTypes.number,
  groupName: PropTypes.string,
  index: PropTypes.number,
  layerId: PropTypes.string,
  max: PropTypes.number,
  min: PropTypes.number,
  setFilterRange: PropTypes.func,
  start: PropTypes.number,
};

export default VectorFilter;
