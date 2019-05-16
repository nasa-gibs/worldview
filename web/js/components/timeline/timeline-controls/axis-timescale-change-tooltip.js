import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

/*
 * Tooltip appears on hover with clickable timeScales based on subdaily availabilty
 *
 * @class AxisTimeScaleChangeTooltip
 * @extends PureComponent
 */
class AxisTimeScaleChangeTooltip extends PureComponent {
  render() {
    let { timeScale, toolTipHovered, changeTimeScale, hasSubdailyLayers } = this.props;
    return (
      <React.Fragment>
        <div id="zoom-btn-container-axis">
          <span
            id="current-zoom"
            className={'zoom-btn zoom-level-display-text'}
          >
            {timeScale}
          </span>
          <div className="wv-zoom-tooltip"
            style={{ display: toolTipHovered ? 'block' : 'none' }}
          >
            <div id="timeline-zoom" className="timeline-zoom">
              <label style={{ textDecoration: 'underline', paddingBottom: '4px', color: '#fff' }}>TIMESCALE</label>
              <span
                id="zoom-years"
                className="zoom-btn zoom-btn-inactive zoom-years"
                onClick={() => changeTimeScale(1)}
              >
                YEAR
              </span>
              <span
                id="zoom-months"
                className="zoom-btn zoom-btn-inactive zoom-months"
                onClick={() => changeTimeScale(2)}
              >
                MONTH
              </span>
              <span
                id="zoom-days"
                className="zoom-btn zoom-btn-inactive zoom-days"
                onClick={() => changeTimeScale(3)}
              >
                DAY
              </span>
              <span
                id="zoom-hours"
                className="zoom-btn zoom-btn-inactive zoom-hours"
                style={{ display: hasSubdailyLayers ? 'block' : 'none' }}
                onClick={() => changeTimeScale(4)}
              >
                HOUR
              </span>
              <span
                id="zoom-minutes"
                className="zoom-btn zoom-btn-inactive zoom-minutes"
                style={{ display: hasSubdailyLayers ? 'block' : 'none' }}
                onClick={() => changeTimeScale(5)}
              >
                MINUTE
              </span>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

AxisTimeScaleChangeTooltip.propTypes = {
  timeScale: PropTypes.string,
  changeTimeScale: PropTypes.func,
  hasSubdailyLayers: PropTypes.bool
};

export default AxisTimeScaleChangeTooltip;
