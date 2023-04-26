import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import lodashDebounce from 'lodash/debounce';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { UncontrolledTooltip } from 'reactstrap';
import { DEFAULT_NUM_GRANULES, MIN_GRANULES, MAX_GRANULES } from '../../../modules/layers/constants';

function GranuleCountSlider(props) {
  const {
    count,
    def,
    granuleDates,
    granulePlatform,
    updateGranuleLayerOptions,
  } = props;

  const [granuleCount, setGranuleCount] = useState(count);

  const onChange = (val) => {
    updateGranuleLayerOptions(granuleDates, def, val);
  };
  const debounceOnchange = lodashDebounce(onChange, 300);

  const satelliteInfo = `Updating granule count for all granules layers associated with the ${granulePlatform} satellite.`;

  return (
    <div className="layer-granule-count-select settings-component">
      <div className="d-flex">
        <h2 className="wv-header">Granule Count</h2>
        <FontAwesomeIcon id="bbox-limit-info" icon="info-circle" className="ms-2" />
        <UncontrolledTooltip
          id="center-align-tooltip"
          placement="right"
          target="bbox-limit-info"
        >
          {satelliteInfo}
        </UncontrolledTooltip>
      </div>
      <input
        type="range"
        className="form-range"
        min={MIN_GRANULES}
        max={MAX_GRANULES}
        defaultValue={count}
        onChange={(e) => {
          const val = parseInt(e.target.value, 10);
          setGranuleCount(val);
          debounceOnchange(val);
        }}
        style={{
          '--value-percent': `${((granuleCount - MIN_GRANULES) / (MAX_GRANULES - MIN_GRANULES)) * 100}%`,
        }}

      />
      <div className="wv-label wv-label-granule-count mt-1">
        {granuleCount}
      </div>
    </div>
  );
}

GranuleCountSlider.defaultProps = {
  count: DEFAULT_NUM_GRANULES,
};
GranuleCountSlider.propTypes = {
  granuleDates: PropTypes.array,
  def: PropTypes.object,
  count: PropTypes.number,
  granulePlatform: PropTypes.string,
  updateGranuleLayerOptions: PropTypes.func,
};

const mapStateToProps = (state) => {
  const { layers } = state;
  const { granulePlatform } = layers.active;

  return {
    granulePlatform,
  };
};

export default connect(
  mapStateToProps,
)(GranuleCountSlider);
