import React from 'react';
import PropTypes from 'prop-types';
import Slider from 'rc-slider';

class GranuleCountSlider extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: props.count,
    };
  }

  render() {
    const {
      def,
      updateGranuleLayerDates,
      granuleDates,
      count,
    } = this.props;
    const { value } = this.state;
    return (
      <div className="layer-granule-count-select settings-component">
        <h2 className="wv-header">Granule Count</h2>
        <Slider
          min={1}
          max={50}
          defaultValue={count}
          onChange={(val) => {
            updateGranuleLayerDates(granuleDates, def.id, val);
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
  count: 20,
};
GranuleCountSlider.propTypes = {
  granuleDates: PropTypes.array,
  def: PropTypes.object,
  count: PropTypes.number,
  updateGranuleLayerDates: PropTypes.func,
};

export default GranuleCountSlider;
