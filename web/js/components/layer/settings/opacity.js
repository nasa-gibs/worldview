import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Slider from 'rc-slider';

const OpacitySelect = function ({ layer, setOpacity, start }) {
  const [value, setValue] = useState(start)
  return (
    <div className="layer-opacity-select settings-component">
      <h2 className="wv-header">Opacity</h2>
      <Slider
        defaultValue={start}
        onChange={(val) => {
          setOpacity(layer.id, (val / 100).toFixed(2));
          setValue(val)
        }}
      />
      <div className="wv-label wv-label-opacity">
        {`${value}%`}
      </div>
    </div>
  );
};

OpacitySelect.defaultProps = {
  start: 100,
};
OpacitySelect.propTypes = {
  layer: PropTypes.object,
  setOpacity: PropTypes.func,
  start: PropTypes.number,
};

export default OpacitySelect;
