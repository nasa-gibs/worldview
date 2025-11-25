import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { debounce } from 'lodash';

function SizeSelect(props) {
  const {
    layer,
    start,
    index,
    groupName,
  } = props;

  const [value, setValue] = useState(start);

  const debouncedSetSize = debounce((layerId, size, index, groupName) => {
    const { setSize, clearSize } = props;
    if (size === 0) {
      clearSize(layerId, index, groupName);
    } else {
      setSize(layerId, size, index, groupName);
    }
  }, 100);

  return (
    <div className="layer-size-select settings-component">
      <h2 className="wv-header">Point Radius</h2>
      <input
        type="range"
        className="form-range"
        min={0}
        max={25}
        step={5}
        defaultValue={start}
        onChange={(e) => {
          const val = parseFloat(e.target.value);
          debouncedSetSize(layer.id, val, index, groupName);
          setValue(val);
        }}
      />
      <div className="wv-label wv-label-size mt-1">
        {value <= 0 ? 1 : value}
        px
      </div>
    </div>
  );
}
SizeSelect.defaultProps = {
  start: 0,
};
SizeSelect.propTypes = {
  layer: PropTypes.object,
  setSize: PropTypes.func,
  clearSize: PropTypes.func,
  start: PropTypes.number,
};

export default SizeSelect;
