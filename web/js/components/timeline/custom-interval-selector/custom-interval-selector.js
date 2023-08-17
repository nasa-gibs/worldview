import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import DeltaInput from './delta-input';
import IntervalSelect from './interval-select';
import {
  TIME_SCALE_FROM_NUMBER,
  TIME_SCALE_TO_NUMBER,
} from '../../../modules/date/constants';
import {
  toggleCustomModal,
  changeCustomInterval as changeCustomIntervalAction,
} from '../../../modules/date/actions';

/*
 * CustomIntervalSelector for Custom Interval Selector
 * group. It is a parent component of this group.
 *
 * @class CustomIntervalSelector
 */
function CustomIntervalSelector(props) {
  const {
    modalOpen,
    hasSubdailyLayers,
  } = props;

  let customIntervalWidget;

  const customDelta = useSelector((state) => state.date.customDelta || 1);
  const customInterval = useSelector((state) => state.date.customInterval || state.date.interval);

  const dispatch = useDispatch();
  const closeModal = () => dispatch(toggleCustomModal(false, undefined));
  const changeCustomInterval = (delta, timeScale) => dispatch(changeCustomIntervalAction(delta, timeScale));

  useEffect(() => {
    if (modalOpen) {
      customIntervalWidget.focus();
    }
  }, [modalOpen]);

  const changeDelta = (value) => {
    if (value >= 0 && value <= 1000) {
      changeCustomInterval(value, customInterval);
    }
  };

  const changeZoomLevel = (zoomLevel) => {
    changeCustomInterval(customDelta, TIME_SCALE_TO_NUMBER[zoomLevel]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  };

  return modalOpen && (
    <div
      onKeyDown={handleKeyPress}
      className={`custom-interval-widget ${hasSubdailyLayers ? 'subdaily' : ''}`}
      tabIndex={0}
      ref={(widget) => { customIntervalWidget = widget; }}
    >
      <h3 className="custom-interval-widget-header">Custom Interval Selector</h3>
      <div className="custom-interval-widget-controls-container">
        <DeltaInput
          deltaValue={customDelta}
          changeDelta={changeDelta}
        />
        <IntervalSelect
          hasSubdailyLayers={hasSubdailyLayers}
          zoomLevel={TIME_SCALE_FROM_NUMBER[customInterval]}
          changeZoomLevel={changeZoomLevel}
        />
      </div>
      <FontAwesomeIcon icon="times" className="wv-close" onClick={closeModal} />
    </div>
  );
}

CustomIntervalSelector.propTypes = {
  hasSubdailyLayers: PropTypes.bool,
  modalOpen: PropTypes.bool,
};

export default CustomIntervalSelector;
