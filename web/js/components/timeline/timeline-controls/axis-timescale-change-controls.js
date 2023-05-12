import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import AxisTimeScaleChangeTooltip from './axis-timescale-change-tooltip';
import Arrow from '../../util/arrow';

/*
 * Up/down arrows for changing timeScale, also wrapper for tooltip
 *
 * @class AxisTimeScaleChangeControls
 * @extends PureComponent
 */
class AxisTimeScaleChangeControls extends PureComponent {
  onClickUp = () => {
    const { decrementTimeScale } = this.props;
    decrementTimeScale();
  };

  onClickDown = () => {
    const { incrementTimeScale } = this.props;
    incrementTimeScale();
  };

  render() {
    const {
      timeScale,
      toolTipHovered,
      changeTimeScale,
      hasSubdailyLayers,
    } = this.props;
    return (
      <div className="zoom-level-change-arrows">
        <AxisTimeScaleChangeTooltip
          timeScale={timeScale}
          toolTipHovered={toolTipHovered}
          changeTimeScale={changeTimeScale}
          hasSubdailyLayers={hasSubdailyLayers}
        />
        <Arrow
          direction="up"
          onClick={this.onClickUp}
          type="zoom-level-up"
        />
        <Arrow
          direction="down"
          onClick={this.onClickDown}
          type="zoom-level-down"
        />
      </div>
    );
  }
}

AxisTimeScaleChangeControls.propTypes = {
  changeTimeScale: PropTypes.func,
  decrementTimeScale: PropTypes.func,
  hasSubdailyLayers: PropTypes.bool,
  incrementTimeScale: PropTypes.func,
  timeScale: PropTypes.string,
  toolTipHovered: PropTypes.bool,
};

export default AxisTimeScaleChangeControls;
