import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import AxisTimeScaleChangeControls from './axis-timescale-change-controls';
import { timeScaleToNumberKey } from '../../../modules/date/constants';

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

  // TimeScale select tooltip on
  toolTipHoverOn = () => {
    this.disableMapScales(true);
    this.setState({
      toolTipHovered: true
    });
  }

  // TimeScale select tooltip off
  toolTipHoverOff = () => {
    this.disableMapScales(false);
    this.setState({
      toolTipHovered: false
    });
  }

  // Toggle visibility of map scales
  disableMapScales = (disable) => {
    let imperialMapScale = document.querySelectorAll('.wv-map-scale-imperial');
    let metricMapScale = document.querySelectorAll('.wv-map-scale-metric');
    if (disable) {
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
    let {
      timeScale,
      timelineHidden,
      hasSubdailyLayers,
      changeTimeScale
    } = this.props;
    return (
      <div
        className="zoom-level-change"
        style={{
          display: timelineHidden ? 'none' : 'block'
        }}
      >
        { timeScale
          ? <div
            onMouseEnter={this.toolTipHoverOn}
            onMouseLeave={this.toolTipHoverOff}>
            <AxisTimeScaleChangeControls
              timeScale={timeScale}
              hasSubdailyLayers={hasSubdailyLayers}
              toolTipHovered={this.state.toolTipHovered}
              changeTimeScale={changeTimeScale}
              incrementTimeScale={this.incrementTimeScale}
              decrementTimeScale={this.decrementTimeScale}
            />
          </div>
          : <div></div>
        }
      </div>
    );
  }
}

AxisTimeScaleChange.propTypes = {
  timeScale: PropTypes.string,
  changeTimeScale: PropTypes.func,
  hasSubdailyLayers: PropTypes.bool
};

export default AxisTimeScaleChange;
