import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import IntervalInput from './interval-input';
import TimeScaleSelect from './timescale-select';

/*
 * A react component, Builds a rather specific
 * interactive widget
 *
 * @class AnimationWidget
 * @extends React.Component
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
    // handle focus widget on opening
    if (this.props.customIntervalModalOpen && !prevProps.customIntervalModalOpen) {
      this.customIntervalWidget.focus();
    }
    // update if higher state changed
    if (prevProps.customIntervalValue !== this.props.customIntervalValue
     || prevProps.zoomLevel !== this.props.zoomLevel) {
      this.setState({
        intervalValue: this.props.customIntervalValue,
        zoomLevel: this.props.customIntervalZoomLevel
      })
    }
  }

  render() {
    return (
      <div
        id="wv-animation-widget-custom-interval"
        onKeyDown={this.handleKeyPress}
        className='wv-animation-widget-custom-interval'
        style={{display: this.props.customIntervalModalOpen ? 'block' : 'none'}}
        tabIndex={0}
        ref={(customIntervalWidget) => { this.customIntervalWidget = customIntervalWidget; }}
      >

      <div>Custom Interval Selector</div>
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', height: '25px' }}>
        <div style={{display: 'flex', flexDirection: 'row' }}>
          <IntervalInput
            intervalValue={Number(this.state.intervalValue)}
            changeInterval={this.changeInterval}
          />
          <TimeScaleSelect
            hasSubdailyLayers={this.props.hasSubdailyLayers}
            zoomLevel={this.state.zoomLevel}
            changeZoomLevel={this.changeZoomLevel}
          />
        </div>
      </div>

      <i className="fa fa-times wv-close" onClick={this.props.toggleCustomIntervalModal}/>
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
