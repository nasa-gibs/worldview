import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import AxisTimeScaleChangeTooltip from './axis-timescale-change-tooltip';

/*
 * Up/down arrows for changing timeScale, also wrapper for tooltip
 *
 * @class AxisTimeScaleChangeControls
 * @extends PureComponent
 */
class AxisTimeScaleChangeControls extends PureComponent {
  onClickUp = () => {
    this.props.incrementTimeScale();
  }

  onClickDown = () => {
    this.props.decrementTimeScale();
  }
  render() {
    let { timeScale, toolTipHovered, changeTimeScale, hasSubdailyLayers } = this.props;
    return (
      <div className="zoom-level-change-arrows">
        <AxisTimeScaleChangeTooltip
          timeScale={timeScale}
          toolTipHovered={toolTipHovered}
          changeTimeScale={changeTimeScale}
          hasSubdailyLayers={hasSubdailyLayers}
        />
        <div
          onClick={this.onClickUp}
          className="date-arrows date-arrow-up"
        >
          <svg width="25" height="8">
            <path d="M 12.5,0 25,8 0,8 z" className="uparrow" />
          </svg>
        </div>
        <div
          onClick={this.onClickDown}
          className="date-arrows date-arrow-down"
        >
          <svg width="25" height="8">
            <path d="M 12.5,0 25,8 0,8 z" className="downarrow" />
          </svg>
        </div>
      </div>

    );
  }
}

AxisTimeScaleChangeControls.propTypes = {
  timeScale: PropTypes.string,
  changeTimeScale: PropTypes.func,
  incrementTimeScale: PropTypes.func,
  decrementTimeScale: PropTypes.func,
  toolTipHovered: PropTypes.bool,
  hasSubdailyLayers: PropTypes.bool
};

export default AxisTimeScaleChangeControls;
