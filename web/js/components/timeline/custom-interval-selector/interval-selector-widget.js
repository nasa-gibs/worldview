import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import DeltaInput from './delta-input';
import TimeScaleSelect from './interval-select';
import {
  timeScaleFromNumberKey,
  timeScaleToNumberKey
} from '../../../modules/date/constants';
import { toggleCustomModal } from '../../../modules/date/actions';
import { connect } from 'react-redux';

/*
 * CustomIntervalSelectorWidget for Custom Interval Selector
 * group. It is a parent component of this group.
 *
 * @class CustomIntervalSelectorWidget
 */
class CustomIntervalSelectorWidget extends PureComponent {
  changeDelta = (value) => {
    if (value >= 0 && value <= 1000) {
      this.props.changeCustomInterval(value, this.props.customIntervalZoomLevel);
    }
  }
  changeZoomLevel = (zoomLevel) => {
    this.props.changeCustomInterval(this.props.customDelta, timeScaleToNumberKey[zoomLevel]);
  }
  handleKeyPress = (e) => {
    if (e.key === 'Escape') {
      this.props.closeModal();
    }
  }
  componentDidUpdate(prevProps) {
    // handle focus widget on opening
    if (this.props.customIntervalModalOpen && !prevProps.customIntervalModalOpen) {
      this.customIntervalWidget.focus();
    }
  }
  render() {
    let {
      customIntervalModalOpen,
      hasSubdailyLayers,
      customDelta,
      customIntervalZoomLevel,
      closeModal
    } = this.props;
    return customIntervalModalOpen && (
      <div
        onKeyDown={this.handleKeyPress}
        className="custom-interval-widget"
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
        <i className="fa fa-times wv-close" onClick={closeModal}/>
      </div>
    );
  }
}

const mapDispatchToProps = (dispatch) => ({
  closeModal: () => {
    dispatch(toggleCustomModal(false, undefined));
  }
});

export default connect(
  null,
  mapDispatchToProps
)(CustomIntervalSelectorWidget);

CustomIntervalSelectorWidget.propTypes = {
  changeCustomInterval: PropTypes.func,
  customDelta: PropTypes.number,
  customIntervalModalOpen: PropTypes.bool,
  customIntervalZoomLevel: PropTypes.number,
  hasSubdailyLayers: PropTypes.bool,
  toggleCustomIntervalModal: PropTypes.func
};
