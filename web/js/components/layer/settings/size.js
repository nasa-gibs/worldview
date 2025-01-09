import React from 'react';
import PropTypes from 'prop-types';
import { debounce } from 'lodash';

class SizeSelect extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: props.start,
    };

    this.debouncedSetSize = debounce((layerId, size, index, groupName) => {
      const { setSize } = this.props;
      setSize(layerId, size, index, groupName);
    }, 100);
  }

  render() {
    const {
      layer,
      start,
      index,
      groupName,
    } = this.props;
    const { value } = this.state;
    return (
      <div className="layer-size-select settings-component">
        <h2 className="wv-header">Point Size</h2>
        <input
          type="range"
          className="form-range"
          min={0}
          max={25}
          step={5}
          defaultValue={start}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            this.debouncedSetSize(layer.id, val, index, groupName);
            this.setState({ value: val });
          }}
        />
        <div className="wv-label wv-label-size mt-1">
          {value <= 0 ? 1 : value}
        </div>
      </div>
    );
  }
}
SizeSelect.defaultProps = {
  start: 0,
};
SizeSelect.propTypes = {
  layer: PropTypes.object,
  setSize: PropTypes.func,
  start: PropTypes.number,
};

export default SizeSelect;
