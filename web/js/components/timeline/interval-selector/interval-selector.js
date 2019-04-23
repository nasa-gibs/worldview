import React from 'react';
import PropTypes from 'prop-types';
import IntervalInput from './interval-input';
import TimeScaleSelect from './timescale-select';
import Button from '../../util/button';

/*
 * A react component, Builds a rather specific
 * interactive widget
 *
 * @class AnimationWidget
 * @extends React.Component
 */
class CustomIntervalSelectorWidget extends React.Component {
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
    })
  }

  changeZoomLevel = (value) => {
    this.setState({
      zoomLevel: value
    })
  }

  reset = () => {
    this.setState({
      intervalValue: 1,
      zoomLevel: this.props.customIntervalZoomLevel
    })
  }

  setIntervalChangeUnit = () => {
    if (this.state.intervalValue > 0) {
      this.props.setIntervalChangeUnit(this.state.intervalValue, this.state.zoomLevel);
    }
  }

  handleKeyPress = (e) => {
    if (e.key == 'Enter') {
      const value = this.state.intervalValue;
      if (value > 0) {
        this.setIntervalChangeUnit();
      }
    }
  }

  componentDidMount() {
    this.setState({
      intervalValue: this.props.customIntervalValue,
      zoomLevel: this.props.customIntervalZoomLevel
    })
  }

  render() {
    return (
      <div
        id="wv-animation-widget-custom-interval"
        // className={
        //   'wv-animation-widget' + (this.state.maxZoom >= 4 ? ' subdaily' : '')
        // }
        onKeyDown={this.handleKeyPress}
        className='wv-animation-widget-custom-interval'
        style={{display: this.props.customIntervalModalOpen ? 'block' : 'none', height: '110px'}}
      >

      <div>Custom Interval Selector</div>
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginTop: '10px' }}>
        <div style={{display: 'flex', flexDirection: 'row' }}>
          <IntervalInput
            intervalValue={this.state.intervalValue}
            changeInterval={this.changeInterval}
          />
          <TimeScaleSelect
            hasSubdailyLayers={this.props.hasSubdailyLayers}
            zoomLevel={this.state.zoomLevel}
            changeZoomLevel={this.changeZoomLevel}
          />
        </div>

        <div style={{display: 'flex', flexDirection: 'column' }} className="custom-interval-buttons">
          <Button
            onClick={this.setIntervalChangeUnit}
            id='set-interval-button'
            text='Set'
            className='red'
            style={{marginBottom: '10px'}}
          />
          <Button
            onClick={() => this.reset()}
            id='reset-interval-button'
            text='Reset'
          />
        </div>
      </div>

      <i className="fa fa-times wv-close" onClick={this.props.toggleCustomIntervalModal}/>
      </div>
    );
  }
}

CustomIntervalSelectorWidget.propTypes = {
  hasSubdailyLayers: PropTypes.bool,
  toggleCustomIntervalModal: PropTypes.func,
  customIntervalValue: PropTypes.number,
  customIntervalZoomLevel: PropTypes.string
};

export default CustomIntervalSelectorWidget;
