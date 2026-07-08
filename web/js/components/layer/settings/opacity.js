import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { debounce } from 'lodash';

const OpacitySelect = ({ layer, setOpacity, start = 100 }) => {
  const [value, setValue] = useState(start);

  const debouncedSetOpacity = useRef(
    debounce((layerId, opacity) => {
      setOpacity(layerId, opacity);
    }, 100),
  ).current;

  return (
    <div className="layer-opacity-select settings-component">
      <h2 className="wv-header">Opacity</h2>
      <input
        type="range"
        className="form-range"
        defaultValue={start}
        onChange={(e) => {
          const val = parseFloat(e.target.value);
          debouncedSetOpacity(layer.id, (val / 100).toFixed(2));
          setValue(val);
        }}
        style={{ '--value-percent': `${value}%` }}
      />
      <div className="wv-label wv-label-opacity mt-1">
        {`${value}%`}
      </div>
    </div>
  );
};

OpacitySelect.propTypes = {
  layer: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  setOpacity: PropTypes.func,
  start: PropTypes.number,
};

export default OpacitySelect;
