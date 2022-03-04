import React from 'react';
import PropTypes from 'prop-types';
import Slider from 'rc-slider';
import lodashDebounce from 'lodash/debounce';
import { DEFAULT_NUM_GRANULES } from '../../../modules/layers/constants';

class GranuleCountSlider extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: props.count,
    };
    this.onChange = this.onChange.bind(this);
    this.debounceOnchange = lodashDebounce(this.onChange, 300);
  }

  onChange(val) {
    const {
      def,
      updateGranuleLayerDates,
      granuleDates,
    } = this.props;
    updateGranuleLayerDates(granuleDates, def.id, val);
  }

  render() {
    const { count } = this.props;
    const { value } = this.state;
    return (
      <div className="layer-granule-count-select settings-component">
        <h2 className="wv-header">Granule Count</h2>
        <Slider
          min={1}
          max={50}
          defaultValue={count}
          onChange={(val) => {
            this.setState({ value: val });
            this.debounceOnchange(val);
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
  count: DEFAULT_NUM_GRANULES,
};
GranuleCountSlider.propTypes = {
  granuleDates: PropTypes.array,
  def: PropTypes.object,
  count: PropTypes.number,
  updateGranuleLayerDates: PropTypes.func,
};

export default GranuleCountSlider;
