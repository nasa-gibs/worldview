import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

const timeUnitAbbreviations = {
  year: 'year',
  month: 'mon',
  day: 'day',
  hour: 'hour',
  minute: 'min'
};

/*
 * Tooltip appears on hover with clickable timeScales based on subdaily availabilty
 *
 * @class AxisTimeScaleChangeTooltip
 * @extends React.Component
 */
class AxisTimeScaleChangeTooltip extends PureComponent {
  render() {
    return (
      <React.Fragment>
        <div id="zoom-btn-container-axis">
          <span
            id="current-zoom"
            className={'zoom-btn zoom-level-display-text'}
          >
            {timeUnitAbbreviations[this.props.timeScale]}
          </span>
          <div className="wv-zoom-tooltip"
            style={{ display: this.props.toolTipHovered ? 'block' : 'none' }}
          >
            <div id="timeline-zoom" className="timeline-zoom">
              <label style={{ textDecoration: 'underline', paddingBottom: '4px', color: '#fff' }}>TIMESCALE</label>
              <span
                id="zoom-years"
                className="zoom-btn zoom-btn-inactive zoom-years"
                onClick={() => this.props.changeTimeScale('year')}
              >
                YEAR
              </span>
              <span
                id="zoom-months"
                className="zoom-btn zoom-btn-inactive zoom-months"
                onClick={() => this.props.changeTimeScale('month')}
              >
                MONTH
              </span>
              <span
                id="zoom-days"
                className="zoom-btn zoom-btn-inactive zoom-days"
                onClick={() => this.props.changeTimeScale('day')}
              >
                DAY
              </span>
              <span
                id="zoom-hours"
                className="zoom-btn zoom-btn-inactive zoom-hours"
                style={{ display: this.props.hasSubdailyLayers ? 'block' : 'none' }}
                onClick={() => this.props.changeTimeScale('hour')}
              >
                HOUR
              </span>
              <span
                id="zoom-minutes"
                className="zoom-btn zoom-btn-inactive zoom-minutes"
                style={{ display: this.props.hasSubdailyLayers ? 'block' : 'none' }}
                onClick={() => this.props.changeTimeScale('minute')}
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
