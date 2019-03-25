import React, { Component } from 'react';

class DateZoomChange extends Component {
  constructor(props) {
    super(props);
    this.state = {
      toolTipHovered: false
    }
  }

  // Toggle zoom select tooltip
  toggleTooltipHover = (isHovered) => {
    this.setState({
      toolTipHovered: isHovered
    })
  }

  handleClickZoom = (zoomSelected) => {
    // close tooltip
    // send props function to change timescale zoom level throughout app
    this.setState({
      toolTipHovered: false
    }, this.props.setTimeScale(zoomSelected));
  }

  render() {
    return (
      <React.Fragment>
        <div id="zoom-btn-container"
        onMouseEnter={() => this.toggleTooltipHover(true)}
        onMouseLeave={() => this.toggleTooltipHover(false)}
        >
          {/* timeScale display */}
          <span
            id="current-zoom"
            className="zoom-btn zoom-btn-active"
          >
            {this.props.timeScaleChangeUnit}
          </span>

          {/* hover timeScale unit dialog / entry point to Custom selector */}
          <div className="wv-tooltip" 
          style={{ display: this.state.toolTipHovered ? 'block' : 'none' }}
          >
            <div id="timeline-zoom" className="timeline-zoom">
              <span
                id="zoom-years"
                className="zoom-btn zoom-btn-inactive zoom-years"
                onClick={() => this.handleClickZoom('year')}
              >
                Years
              </span>
              <span
                id="zoom-months"
                className="zoom-btn zoom-btn-inactive zoom-months"
                onClick={() => this.handleClickZoom('month')}
              >
                Months
              </span>
              <span
                id="zoom-days"
                className="zoom-btn zoom-btn-inactive zoom-days"
                onClick={() => this.handleClickZoom('day')}
              >
                Days
              </span>
              <span
                id="zoom-minutes"
                className="zoom-btn zoom-btn-inactive zoom-minutes"
                onClick={() => this.handleClickZoom('minute')}
              >
                Minutes
              </span>
              <span
                id="zoom-custom"
                style={{color: '#7890cd'}}
                className="zoom-btn zoom-btn-inactive zoom-custom"
                onClick={() => this.handleClickZoom('custom')}
              >
                {this.props.customTimeInterval ? this.props.customTimeInterval : 'Custom'}
              </span>
            </div>
          </div>
        </div>

      </React.Fragment>
    );
  }
}

export default DateZoomChange;
