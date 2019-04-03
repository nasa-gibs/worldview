import React from 'react';
import PropTypes from 'prop-types';
import AxisTimeScaleChangeControls from './axis-timescale-change-controls';

/*
 * Parent element for timeScale change controls and tooltip
 * on the right side of the timeline
 *
 * @class AxisTimeScaleChange
 * @extends React.Component
 */
class AxisTimeScaleChange extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      toolTipHovered: false,
      timeScales: [ 'day', 'month', 'year' ]
    };
  }

  // Toggle timeScale select tooltip
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

  incrementTimeScale = () => {
    let timeScales = this.state.timeScales;
    let arrayIndex = timeScales.indexOf(this.props.timeScale);
    if (arrayIndex < timeScales.length - 1) {
      let nextGreaterTimeScale = timeScales[arrayIndex + 1];
      this.props.changeTimescale(nextGreaterTimeScale);
    }
  }

  decrementTimeScale = () => {
    let timeScales = this.state.timeScales;
    let arrayIndex = timeScales.indexOf(this.props.timeScale);
    if (arrayIndex > 0) {
      let nextSmallerTimeScale = timeScales[arrayIndex - 1];
      this.props.changeTimescale(nextSmallerTimeScale);
    }
  }

  componentDidMount() {
    this.setState({
      timeScales: this.getTimeScales(this.props.hasSubdailyLayers)
    })
  }

  componentDidUpdate(prevProps) {
    if(this.props.hasSubdailyLayers !== prevProps.hasSubdailyLayers) {
      this.setState({
        timeScales: this.getTimeScales(this.props.hasSubdailyLayers)
      })
    }
  }

  render() {
    return (
      this.props.timeScale ?
      <div
        onMouseEnter={() => this.toggleTooltipHover(true)}
        onMouseLeave={() => this.toggleTooltipHover(false)}>
        <AxisTimeScaleChangeControls
          timeScale={this.props.timeScale}
          hasSubdailyLayers={this.props.hasSubdailyLayers}
          toolTipHovered={this.state.toolTipHovered}
          changeTimeScale={this.props.changeTimescale}
          incrementTimeScale={this.incrementTimeScale}
          decrementTimeScale={this.decrementTimeScale}
        />
      </div>
      :
      <div></div>
    );
  }
}

AxisTimeScaleChange.propTypes = {
  timeScale: PropTypes.string,
  changeTimescale: PropTypes.func,
  hasSubdailyLayers: PropTypes.bool
};

export default AxisTimeScaleChange;
