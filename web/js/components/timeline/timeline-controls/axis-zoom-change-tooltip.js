import React, { PureComponent } from 'react';

const timeUnitAbbreviations = {
  year: 'year',
  month: 'mon',
  day: 'day',
  hour: 'hour',
  minute: 'min'
};

class AxisZoomChangeTooltip extends PureComponent {

  handleClickZoom = (zoomSelected) => {
    this.props.changeZoomLevel(zoomSelected);
  }

  render() {
    return (
      <React.Fragment>
        <div id="zoom-btn-container-axis"
        >
          {/* timeScale display */}
          <span
            id="current-zoom"
            className={'zoom-btn zoom-level-display-text'}
          >
            {timeUnitAbbreviations[this.props.zoomLevel]}
          </span>

          {/* hover timeScale unit dialog / entry point to Custom selector */}
          <div className="wv-zoom-tooltip"
          style={{ display: this.props.toolTipHovered ? 'block' : 'none' }}
          >
            <div id="timeline-zoom" className="timeline-zoom">
              <label style={{ textDecoration: 'underline', paddingBottom: '4px', color: '#fff' }}>TIMESCALE</label>
              <span
                id="zoom-years"
                className="zoom-btn zoom-btn-inactive zoom-years"
                onClick={() => this.handleClickZoom('year')}
              >
                YEAR
              </span>
              <span
                id="zoom-months"
                className="zoom-btn zoom-btn-inactive zoom-months"
                onClick={() => this.handleClickZoom('month')}
              >
                MONTH
              </span>
              <span
                id="zoom-days"
                className="zoom-btn zoom-btn-inactive zoom-days"
                onClick={() => this.handleClickZoom('day')}
              >
                DAY
              </span>
              <span
                id="zoom-hours"
                className="zoom-btn zoom-btn-inactive zoom-hours"
                style={{ display: this.props.hasSubdailyLayers ? 'block' : 'none' }}
                onClick={() => this.handleClickZoom('hour')}
              >
                HOUR
              </span>
              <span
                id="zoom-minutes"
                className="zoom-btn zoom-btn-inactive zoom-minutes"
                style={{ display: this.props.hasSubdailyLayers ? 'block' : 'none' }}
                onClick={() => this.handleClickZoom('minute')}
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

export default AxisZoomChangeTooltip;
