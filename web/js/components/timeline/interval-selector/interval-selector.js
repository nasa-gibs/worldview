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
      intervalValue: 1,
      zoomLevel: 'day'
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
    this.props.setIntervalChangeUnit(this.state.intervalValue, this.state.zoomLevel);
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
        className='wv-animation-widget'
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
            zoomLevel={this.state.zoomLevel}
            changeZoomLevel={this.changeZoomLevel}
          />
        </div>

        <div style={{display: 'flex', flexDirection: 'column' }} className="custom-interval-buttons">
          <Button
            // onClick={() => this.props.setInterval(this.state.intervalValue, this.state.zoomLevel)}
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
  setInterval: PropTypes.func,
  toggleCustomIntervalModal: PropTypes.func,
  customIntervalValue: PropTypes.number,
  customIntervalZoomLevel: PropTypes.string
};

export default CustomIntervalSelectorWidget;
