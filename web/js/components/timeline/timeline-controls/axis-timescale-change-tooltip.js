import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

/*
 * Tooltip appears on hover with clickable timeScales based on subdaily availabilty
 *
 * @class AxisTimeScaleChangeTooltip
 * @extends PureComponent
 */
class AxisTimeScaleChangeTooltip extends PureComponent {
  // Handle change axis timescale
  changeTimeScale = (timeScale) => {
    // eslint-disable-next-line react/destructuring-assignment
    this.props.changeTimeScale(timeScale);
  };

  // Individual linking timescale handlers
  changeTimeScaleYear = () => {
    this.changeTimeScale(1);
  };

  changeTimeScaleMonth = () => {
    this.changeTimeScale(2);
  };

  changeTimeScaleDay = () => {
    this.changeTimeScale(3);
  };

  changeTimeScaleHour = () => {
    this.changeTimeScale(4);
  };

  changeTimeScaleMinute = () => {
    this.changeTimeScale(5);
  };

  render() {
    const { timeScale, toolTipHovered, hasSubdailyLayers } = this.props;
    return (
      <div id="zoom-btn-container-axis">
        <span
          id="current-zoom"
          className={
              `zoom-btn zoom-level-display-text zoom-${timeScale.toLowerCase()}`
            }
        >
          {timeScale}
        </span>
        <div
          className="wv-zoom-tooltip"
          style={{ display: toolTipHovered ? 'block' : 'none' }}
        >
          <div id="timeline-zoom" className="timeline-zoom">
            <label
              style={{
                textDecoration: 'underline',
                paddingBottom: '4px',
                color: '#fff',
              }}
            >
              TIMESCALE
            </label>
            <span
              id="zoom-years"
              className="zoom-btn zoom-years"
              onClick={this.changeTimeScaleYear}
            >
              YEAR
            </span>
            <span
              id="zoom-months"
              className="zoom-btn zoom-months"
              onClick={this.changeTimeScaleMonth}
            >
              MONTH
            </span>
            <span
              id="zoom-days"
              className="zoom-btn zoom-days"
              onClick={this.changeTimeScaleDay}
            >
              DAY
            </span>
            {hasSubdailyLayers ? (
              <>
                <span
                  id="zoom-hours"
                  className="zoom-btn zoom-hours"
                  onClick={this.changeTimeScaleHour}
                >
                  HOUR
                </span>
                <span
                  id="zoom-minutes"
                  className="zoom-btn zoom-minutes"
                  onClick={this.changeTimeScaleMinute}
                >
                  MINUTE
                </span>
              </>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
}

AxisTimeScaleChangeTooltip.propTypes = {
  changeTimeScale: PropTypes.func,
  hasSubdailyLayers: PropTypes.bool,
  timeScale: PropTypes.string,
  toolTipHovered: PropTypes.bool,
};

export default AxisTimeScaleChangeTooltip;
