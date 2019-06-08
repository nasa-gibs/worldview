import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import IntervalInput from './interval-input';
import TimeScaleSelect from './timescale-select';

import { timeScaleFromNumberKey, timeScaleToNumberKey } from '../../../modules/date/constants';

/*
 * CustomIntervalSelectorWidget for Custom Interval Selector
 * group. It is a parent component of this group.
 *
 * @class CustomIntervalSelectorWidget
 */
class CustomIntervalSelectorWidget extends PureComponent {
  changeInterval = (value) => {
    if (value >= 0 && value <= 1000) {
      this.props.changeCustomInterval(value, this.props.customIntervalZoomLevel);
    }
  }

  changeZoomLevel = (zoomLevel) => {
    this.props.changeCustomInterval(this.props.customDelta, timeScaleToNumberKey[zoomLevel]);
  }

  handleKeyPress = (e) => {
    if (e.key === 'Escape') {
      this.props.toggleCustomIntervalModal();
    }
  }

  componentDidUpdate(prevProps) {
    let { customIntervalModalOpen } = this.props;
    // handle focus widget on opening
    if (customIntervalModalOpen && !prevProps.customIntervalModalOpen) {
      this.customIntervalWidget.focus();
    }
  }

  render() {
    let {
      customIntervalModalOpen,
      hasSubdailyLayers,
      toggleCustomIntervalModal,
      customDelta,
      customIntervalZoomLevel
    } = this.props;
    return (
      <div
        id="wv-animation-widget-custom-interval"
        onKeyDown={this.handleKeyPress}
        className='wv-animation-widget-custom-interval'
        style={{ display: customIntervalModalOpen ? 'block' : 'none' }}
        tabIndex={0}
        ref={(customIntervalWidget) => { this.customIntervalWidget = customIntervalWidget; }}
      >
        <div>Custom Interval Selector</div>
        <div style={{ height: '25px' }}>
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            <IntervalInput
              intervalValue={customDelta}
              changeInterval={this.changeInterval}
            />
            <TimeScaleSelect
              hasSubdailyLayers={hasSubdailyLayers}
              zoomLevel={timeScaleFromNumberKey[customIntervalZoomLevel]}
              changeZoomLevel={this.changeZoomLevel}
            />
          </div>
        </div>
        <i className="fa fa-times wv-close" onClick={toggleCustomIntervalModal}/>
      </div>
    );
  }
}

CustomIntervalSelectorWidget.propTypes = {
  changeCustomInterval: PropTypes.func,
  toggleCustomIntervalModal: PropTypes.func,
  customDelta: PropTypes.number,
  customIntervalZoomLevel: PropTypes.number,
  customIntervalModalOpen: PropTypes.bool,
  hasSubdailyLayers: PropTypes.bool
};

export default CustomIntervalSelectorWidget;
