import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import DeltaInput from './delta-input';
import IntervalSelect from './interval-select';
import {
  TIME_SCALE_FROM_NUMBER,
  TIME_SCALE_TO_NUMBER,
} from '../../../modules/date/constants';
import {
  selectInterval as selectIntervalAction,
  changeCustomInterval as changeCustomIntervalAction,
} from '../../../modules/date/actions';

function MobileCustomIntervalSelector(props) {
  const {
    changeCustomInterval,
    customInterval,
    hasSubdailyLayers,
    customDelta,
    isMobile,
  } = props;

  const changeDelta = (value) => {
    if (value >= 0 && value <= 1000) {
      changeCustomInterval(value, customInterval);
    }
  };

  const changeZoomLevel = (zoomLevel) => {
    changeCustomInterval(customDelta, TIME_SCALE_TO_NUMBER[zoomLevel]);
  };

  return (
    <div className="custom-animation-interval-container">
      <h3 className="custom-animation-interval-header">Interval Selector</h3>
      <div className="custom-interval-widget-controls-container">
        <DeltaInput
          deltaValue={customDelta}
          changeDelta={changeDelta}
          isMobile={isMobile}
        />
        <IntervalSelect
          hasSubdailyLayers={hasSubdailyLayers}
          zoomLevel={TIME_SCALE_FROM_NUMBER[customInterval]}
          changeZoomLevel={changeZoomLevel}
          interval={customInterval}
          isMobile={isMobile}
        />
      </div>
    </div>
  );
}

const mapDispatchToProps = (dispatch) => ({
  changeCustomInterval: (delta, timeScale) => {
    dispatch(changeCustomIntervalAction(delta, timeScale));
  },
  selectInterval: (delta, timeScale, customSelected) => {
    dispatch(selectIntervalAction(delta, timeScale, customSelected));
  },
});

const mapStateToProps = (state) => {
  const { date, screenSize } = state;
  const {
    interval, customInterval, customDelta, customSelected,
  } = date;
  return {
    customDelta: customDelta || 1,
    customInterval: customInterval || interval,
    customSelected,
    interval,
    isMobile: screenSize.isMobileDevice,
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MobileCustomIntervalSelector);

MobileCustomIntervalSelector.propTypes = {
  changeCustomInterval: PropTypes.func,
  customDelta: PropTypes.number,
  customInterval: PropTypes.number,
  hasSubdailyLayers: PropTypes.bool,
  isMobile: PropTypes.bool,
};
