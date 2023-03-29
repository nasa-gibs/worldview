import React from 'react';
import PropTypes from 'prop-types';
import { debounce } from 'lodash';

class OpacitySelect extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: props.start,
    };

    this.debouncedSetOpacity = debounce((layerId, opacity) => {
      const { setOpacity } = this.props;
      setOpacity(layerId, opacity);
    }, 100);
  }

  render() {
    const { layer, start } = this.props;
    const { value } = this.state;
    return (
      <div className="layer-opacity-select settings-component">
        <h2 className="wv-header">Opacity</h2>
        <input
          type="range"
          className="form-range"
          defaultValue={start}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            this.debouncedSetOpacity(layer.id, (val / 100).toFixed(2));
            this.setState({ value: val });
          }}
          style={{ '--value-percent': `${value}%` }}
        />
        <div className="wv-label wv-label-opacity mt-1">
          {`${value}%`}
        </div>
      </div>
    );
  }
}
OpacitySelect.defaultProps = {
  start: 100,
};
OpacitySelect.propTypes = {
  layer: PropTypes.object,
  setOpacity: PropTypes.func,
  start: PropTypes.number,
};

export default OpacitySelect;
