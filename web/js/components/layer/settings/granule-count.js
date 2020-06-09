import React from 'react';
import PropTypes from 'prop-types';
import Slider from 'rc-slider';

class GranuleCountSlider extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: props.start,
    };
  }

  render() {
    const {
      layer,
      updateGranuleLayerDates,
      granuleDates,
      start,
    } = this.props;
    const { value } = this.state;
    return (
      <div className="layer-granule-count-select settings-component">
        <h2 className="wv-header">Granule Count</h2>
        <Slider
          min={1}
          max={50}
          defaultValue={start}
          onChange={(val) => {
            updateGranuleLayerDates(granuleDates, layer.id, val);
            this.setState({ value: val });
          }}
        />
        <div className="wv-label wv-label-granule-count">
          {value}
        </div>
      </div>
    );
  }
}
GranuleCountSlider.defaultProps = {
  start: 20,
};
GranuleCountSlider.propTypes = {
  granuleDates: PropTypes.array,
  layer: PropTypes.object,
  start: PropTypes.number,
  updateGranuleLayerDates: PropTypes.func,
};

export default GranuleCountSlider;
