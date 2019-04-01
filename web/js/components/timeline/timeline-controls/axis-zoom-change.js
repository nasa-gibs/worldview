import React from 'react';
import PropTypes from 'prop-types';
import AxisZoomChangeControls from './axis-zoom-change-controls';
import AxisZoomChangeTooltip from './axis-zoom-change-tooltip';

/*
 * A react component, Builds a rather specific
 * interactive widget
 *
 * @class AnimationWidget
 * @extends React.Component
 */
class AxisZoomChange extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      zoomLevel: '',
      toolTipHovered: false,
      hasSubdailyLayers: '',
      timeScales: ''
    };
  }

  // Toggle zoom select tooltip
  toggleTooltipHover = (isHovered) => {
    // toggle visibility of map scales
    let imperialMapScale = document.querySelectorAll('.wv-map-scale-imperial');
    let metricMapScale = document.querySelectorAll('.wv-map-scale-metric');
    if (isHovered) {
      for (let el of imperialMapScale) {
        el.style.display = 'none';
      }
      for (let el of metricMapScale) {
        el.style.display = 'none';
      }
    } else {
      for (let el of imperialMapScale) {
        el.style.display = 'block';
      }
      for (let el of metricMapScale) {
        el.style.display = 'block';
      }
    }
    this.setState({
      toolTipHovered: isHovered
    })
  }

  // get available time scales based on if subdaily or not
  getTimeScales = (hasSubdailyLayers) => {
    if (hasSubdailyLayers) {
      return [ 'minute', 'hour', 'day', 'month', 'year' ];
    } else {
      return [ 'day', 'month', 'year' ];
    }
  }

  // changeInterval = (value) => {
  //   this.setState({
  //     intervalValue: value
  //   })
  // }

  changeZoomLevel = (timeScale) => {
    // this.setState({
    //   zoomLevel: value
    // })
    // if (timeScale !== this.state.zoomLevel) {
      this.props.changeTimescale(timeScale);
    // }
  }

  incrementZoomLevel = () => {
    let timeScales = this.state.timeScales;
    let arrayIndex = timeScales.indexOf(this.state.zoomLevel);
    console.log(timeScales, arrayIndex)
    if (arrayIndex < timeScales.length - 1) {
      let nextGreaterTimeScale = timeScales[arrayIndex + 1];
      this.changeZoomLevel(nextGreaterTimeScale);
    }
  }

  decrementZoomLevel = () => {
    let timeScales = this.state.timeScales;
    let arrayIndex = timeScales.indexOf(this.state.zoomLevel);
    console.log(timeScales, arrayIndex)
    if (arrayIndex > 0) {
      let nextSmallerTimeScale = timeScales[arrayIndex - 1];
      this.changeZoomLevel(nextSmallerTimeScale);
    }
  }

  // reset = () => {
  //   this.setState({
  //     intervalValue: 1,
  //     zoomLevel: this.props.customIntervalZoomLevel
  //   })
  // }

  // setIntervalChangeUnit = () => {
  //   this.props.setIntervalChangeUnit(this.state.intervalValue, this.state.zoomLevel);
  // }

  componentDidMount() {
    this.setState({
      zoomLevel: this.props.zoomLevel,
      hasSubdailyLayers: this.props.hasSubdailyLayers,
      timeScales: this.getTimeScales(this.props.hasSubdailyLayers)
    })
  }

  componentDidUpdate(prevProps) {
    if(this.props.zoomLevel !== prevProps.zoomLevel) {
      this.setState({
        zoomLevel: this.props.zoomLevel
      })
    }
    if(this.props.hasSubdailyLayers !== prevProps.hasSubdailyLayers) {
      this.setState({
        hasSubdailyLayers: this.props.hasSubdailyLayers,
        timeScales: this.getTimeScales(this.props.hasSubdailyLayers)
      })
    }
  }

  render() {
    return (
      this.state.zoomLevel ?
      <div
      onMouseEnter={() => this.toggleTooltipHover(true)}
      onMouseLeave={() => this.toggleTooltipHover(false)}>
          <AxisZoomChangeControls
            zoomLevel={this.state.zoomLevel}
            toolTipHovered={this.state.toolTipHovered}
            changeZoomLevel={this.changeZoomLevel}
            hasSubdailyLayers={this.state.hasSubdailyLayers}
            incrementZoomLevel={this.incrementZoomLevel}
            decrementZoomLevel={this.decrementZoomLevel}
          />

      </div>
      :
      <div></div>
    );
  }
}

// AxisZoomChange.propTypes = {
//   setInterval: PropTypes.func,
//   toggleCustomIntervalModal: PropTypes.func,
//   customIntervalValue: PropTypes.number,
//   customIntervalZoomLevel: PropTypes.string
// };

export default AxisZoomChange;
