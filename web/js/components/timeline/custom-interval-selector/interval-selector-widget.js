import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import DeltaInput from './delta-input';
import TimeScaleSelect from './interval-select';
import {
  timeScaleFromNumberKey,
  timeScaleToNumberKey,
} from '../../../modules/date/constants';
import { toggleCustomModal } from '../../../modules/date/actions';


/*
 * CustomIntervalSelectorWidget for Custom Interval Selector
 * group. It is a parent component of this group.
 *
 * @class CustomIntervalSelectorWidget
 */
class CustomIntervalSelectorWidget extends PureComponent {
  componentDidUpdate(prevProps) {
    const { customIntervalModalOpen } = this.props;
    // handle focus widget on opening
    if (customIntervalModalOpen && !prevProps.customIntervalModalOpen) {
      this.customIntervalWidget.focus();
    }
  }

  changeDelta = (value) => {
    const {
      changeCustomInterval, customIntervalZoomLevel,
    } = this.props;
    if (value >= 0 && value <= 1000) {
      changeCustomInterval(value, customIntervalZoomLevel);
    }
  }

  changeZoomLevel = (zoomLevel) => {
    const { changeCustomInterval, customDelta } = this.props;
    changeCustomInterval(customDelta, timeScaleToNumberKey[zoomLevel]);
  }

  handleKeyPress= (e) => {
    const { closeModal } = this.props;
    if (e.key === 'Escape') {
      closeModal();
    }
  }

  render() {
    const {
      customIntervalModalOpen,
      hasSubdailyLayers,
      customDelta,
      customIntervalZoomLevel,
      closeModal,
    } = this.props;
    return customIntervalModalOpen && (
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
          <TimeScaleSelect
            hasSubdailyLayers={hasSubdailyLayers}
            zoomLevel={timeScaleFromNumberKey[customIntervalZoomLevel]}
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
});

export default connect(
  null,
  mapDispatchToProps,
)(CustomIntervalSelectorWidget);

CustomIntervalSelectorWidget.propTypes = {
  changeCustomInterval: PropTypes.func,
  closeModal: PropTypes.func,
  customDelta: PropTypes.number,
  customIntervalModalOpen: PropTypes.bool,
  customIntervalZoomLevel: PropTypes.number,
  hasSubdailyLayers: PropTypes.bool,
};
