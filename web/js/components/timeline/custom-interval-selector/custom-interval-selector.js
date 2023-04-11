import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
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
class CustomIntervalSelector extends PureComponent {
  componentDidUpdate(prevProps) {
    const {
      modalOpen,
    } = this.props;

    if (modalOpen && !prevProps.modalOpen) {
      this.customIntervalWidget.focus();
    }
  }

  changeDelta = (value) => {
    const {
      changeCustomInterval, customInterval,
    } = this.props;
    if (value >= 0 && value <= 1000) {
      changeCustomInterval(value, customInterval);
    }
  };

  changeZoomLevel = (zoomLevel) => {
    const { changeCustomInterval, customDelta } = this.props;
    changeCustomInterval(customDelta, TIME_SCALE_TO_NUMBER[zoomLevel]);
  };

  handleKeyPress = (e) => {
    const { closeModal } = this.props;
    if (e.key === 'Escape') {
      closeModal();
    }
  };

  render() {
    const {
      modalOpen,
      hasSubdailyLayers,
      customDelta,
      customInterval,
      closeModal,
    } = this.props;
    return modalOpen && (
      <div
        onKeyDown={this.handleKeyPress}
        className={`custom-interval-widget ${hasSubdailyLayers ? 'subdaily' : ''}`}
        tabIndex={0}
        ref={(customIntervalWidget) => { this.customIntervalWidget = customIntervalWidget; }}
      >
        <h3 className="custom-interval-widget-header">Custom Interval Selector</h3>
        <div className="custom-interval-widget-controls-container">
          <DeltaInput
            deltaValue={customDelta}
            changeDelta={this.changeDelta}
          />
          <IntervalSelect
            hasSubdailyLayers={hasSubdailyLayers}
            zoomLevel={TIME_SCALE_FROM_NUMBER[customInterval]}
            changeZoomLevel={this.changeZoomLevel}
          />
        </div>
        <FontAwesomeIcon icon="times" className="wv-close" onClick={closeModal} />
      </div>
    );
  }
}

const mapDispatchToProps = (dispatch) => ({
  closeModal: () => {
    dispatch(toggleCustomModal(false, undefined));
  },
  changeCustomInterval: (delta, timeScale) => {
    dispatch(changeCustomIntervalAction(delta, timeScale));
  },
});

const mapStateToProps = (state) => {
  const { date } = state;
  const {
    interval, customInterval, customDelta, customSelected,
  } = date;
  return {
    customDelta: customDelta || 1,
    customInterval: customInterval || interval,
    customSelected,
    interval,
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(CustomIntervalSelector);

CustomIntervalSelector.propTypes = {
  changeCustomInterval: PropTypes.func,
  closeModal: PropTypes.func,
  customDelta: PropTypes.number,
  customInterval: PropTypes.number,
  hasSubdailyLayers: PropTypes.bool,
  modalOpen: PropTypes.bool,
};
