import React from 'react';
import PropTypes from 'prop-types';
import Slider from 'rc-slider';

class OpacitySelect extends React.Component {
  constructor(props) {
    console.log(props);
    super(props);
    this.state = {
      value: props.start,
    };
  }

  render() {
    const { layer, setOpacity, start } = this.props;
    console.log(`start: ${start}`);
    const { value } = this.state;
    return (
      <div className="layer-opacity-select settings-component">
        <h2 className="wv-header">Opacity</h2>
        <Slider
          defaultValue={start}
          onChange={(val) => {
            console.log(`val: ${val}`);
            console.log(`layer.id: ${layer.id}`);
            setOpacity(layer.id, (val / 100).toFixed(2));
            this.setState({ value: val });
          }}
        />
        <div className="wv-label wv-label-opacity">
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
