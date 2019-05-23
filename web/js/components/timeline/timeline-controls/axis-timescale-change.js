import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import AxisTimeScaleChangeControls from './axis-timescale-change-controls';

const timeScaleToNumberKey = {
  'custom': 0,
  'year': 1,
  'month': 2,
  'day': 3,
  'hour': 4,
  'minute': 5
};

/*
 * Parent element for timeScale change controls and tooltip
 * on the right side of the timeline
 *
 * @class AxisTimeScaleChange
 * @extends React.Component
 */
class AxisTimeScaleChange extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      toolTipHovered: false
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

  // ex: month(2) to day(3)
  incrementTimeScale = () => {
    let timeScaleNumber = timeScaleToNumberKey[this.props.timeScale];
    let maxTimeScaleNumber = this.props.hasSubdailyLayers ? 5 : 3;
    if (timeScaleNumber < maxTimeScaleNumber) {
      this.props.changeTimeScale(timeScaleNumber + 1);
    }
  }

  // ex: day(3) to month(2)
  decrementTimeScale = () => {
    let timeScaleNumber = timeScaleToNumberKey[this.props.timeScale];
    if (timeScaleNumber > 1) {
      this.props.changeTimeScale(timeScaleNumber - 1);
    }
  }

  render() {
    let { timeScale, hasSubdailyLayers, changeTimeScale } = this.props;
    return (
      timeScale ?
      <div
        onMouseEnter={() => this.toggleTooltipHover(true)}
        onMouseLeave={() => this.toggleTooltipHover(false)}>
        <AxisTimeScaleChangeControls
          timeScale={timeScale}
          hasSubdailyLayers={hasSubdailyLayers}
          toolTipHovered={this.state.toolTipHovered}
          changeTimeScale={changeTimeScale}
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
  changeTimeScale: PropTypes.func,
  hasSubdailyLayers: PropTypes.bool
};

export default AxisTimeScaleChange;
