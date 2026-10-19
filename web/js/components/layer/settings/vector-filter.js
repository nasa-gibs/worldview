import { useState } from 'react';
import PropTypes from 'prop-types';
import lodashDebounce from 'lodash/debounce';

function VectorFilter(props) {
  const {
    start,
    end,
    layerId,
    index,
    groupName,
    min,
    max,
  } = props;

  const [startState, setStartState] = useState(start);
  const [endState, setEndState] = useState(end);

  const debounceSetRange = lodashDebounce(props.setFilterRange, 300);

  /**
   * Update filter values
   * @param {Array} thresholdArray | Array of start/end indexs for colormap
   */
  function updateFilter(thresholdArray) {
    const newStart = Math.ceil(Number(thresholdArray[0]));
    const newEnd = Math.ceil(Number(thresholdArray[1]));
    if (newStart === startState && newEnd === endState) {
      return;
    }
    if (newStart !== startState) {
      setStartState(newStart);
    }
    if (newEnd !== endState) {
      setEndState(newEnd);
    }
    // Update local state on every range-selector change but debounce threshold model update
    debounceSetRange(
      layerId,
      parseFloat(newStart),
      parseFloat(newEnd),
      index,
      groupName,
    );
  }

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
          defaultValue={endState}
          min={min}
          max={max}
          onChange={(e) => updateFilter([startState, parseInt(e.target.value, 10)])}
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
