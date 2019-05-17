import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import IntervalInput from './interval-input';
import TimeScaleSelect from './timescale-select';

/*
 * CustomIntervalSelectorWidget for Custom Interval Selector
 * group. It is a parent component of this group.
 *
 * @class CustomIntervalSelectorWidget
 */
class CustomIntervalSelectorWidget extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      intervalValue: '',
      zoomLevel: ''
    };
  }

  changeInterval = (value) => {
    this.setState({
      intervalValue: value
    }, () => {
      if (value > 0 && value <= 1000) {
        this.props.setIntervalChangeUnit(value, this.state.zoomLevel);
      }
    });
  }

  changeZoomLevel = (zoomLevel) => {
    this.setState({
      zoomLevel: zoomLevel
    }, this.props.setIntervalChangeUnit(this.state.intervalValue, zoomLevel));
  }

  setIntervalChangeUnit = () => {
    if (this.state.intervalValue > 0) {
      this.props.setIntervalChangeUnit(this.state.intervalValue, this.state.zoomLevel);
    }
  }

  handleKeyPress = (e) => {
    const value = this.state.intervalValue;
    if (e.key === 'Enter') {
      if (value > 0) {
        this.setIntervalChangeUnit();
      }
    } else if (e.key === 'Escape') {
      this.props.toggleCustomIntervalModal();
    }
  }

  componentDidMount() {
    this.setState({
      intervalValue: this.props.customIntervalValue,
      zoomLevel: this.props.customIntervalZoomLevel
    })
  }

  componentDidUpdate(prevProps) {
    let { customIntervalModalOpen, customIntervalValue, zoomLevel, customIntervalZoomLevel } = this.props;
    // handle focus widget on opening
    if (customIntervalModalOpen && !prevProps.customIntervalModalOpen) {
      this.customIntervalWidget.focus();
    }
    // update if higher state changed
    if (customIntervalValue !== prevProps.customIntervalValue
     || zoomLevel !== prevProps.zoomLevel) {
      this.setState({
        intervalValue: customIntervalValue,
        zoomLevel: customIntervalZoomLevel
      })
    }
  }

  render() {
    let { customIntervalModalOpen, hasSubdailyLayers, toggleCustomIntervalModal } = this.props;
    let { intervalValue, zoomLevel } = this.state;
    return (
      <div
        id="wv-animation-widget-custom-interval"
        onKeyDown={this.handleKeyPress}
        className='wv-animation-widget-custom-interval'
        style={{display: customIntervalModalOpen ? 'block' : 'none'}}
        tabIndex={0}
        ref={(customIntervalWidget) => { this.customIntervalWidget = customIntervalWidget; }}
      >

      <div>Custom Interval Selector</div>
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', height: '25px' }}>
        <div style={{display: 'flex', flexDirection: 'row' }}>
          <IntervalInput
            intervalValue={Number(intervalValue)}
            changeInterval={this.changeInterval}
          />
          <TimeScaleSelect
            hasSubdailyLayers={hasSubdailyLayers}
            zoomLevel={zoomLevel}
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
  setIntervalChangeUnit: PropTypes.func,
  toggleCustomIntervalModal: PropTypes.func,
  customIntervalValue: PropTypes.number,
  customIntervalZoomLevel: PropTypes.string,
  customIntervalModalOpen: PropTypes.bool,
  hasSubdailyLayers: PropTypes.bool
};

export default CustomIntervalSelectorWidget;
