import React, { Component } from 'react';
import PropTypes from 'prop-types';

class TimeScaleIntervalChange extends Component {
  constructor(props) {
    super(props);
    this.state = {
      toolTipHovered: false,
      customIntervalText: 'Custom'
    }
  }

  // Toggle zoom select tooltip
  toggleTooltipHover = (isHovered) => {
    this.setState({
      toolTipHovered: isHovered
    })
  }

  handleClickZoom = (intervalSelected, openDialog) => {
    // close tooltip
    // send props function to change timescale zoom level throughout app
    this.setState({
      toolTipHovered: false,
    }, this.props.setTimeScaleIntervalChangeUnit(intervalSelected, openDialog));
  }

  // set custom text for custom interval
  setCustomIntervalText = () => {
    this.setState({
      customIntervalText: this.props.customDelta + ' ' + this.props.customIntervalZoomLevel
    })
  }

  componentDidMount () {
    if (this.props.customDelta !== 1) {
      this.setCustomIntervalText();
    }
  }

  componentDidUpdate (prevProps, prevState) {
    let { customDelta, timeScaleChangeUnit, customSelected } = this.props;
    if (customDelta && timeScaleChangeUnit) {
      if (customSelected && customDelta !== 1 && this.state.customIntervalText === 'Custom') {
        this.setCustomIntervalText();
      } else if (customSelected && (customDelta !== prevProps.customDelta || timeScaleChangeUnit !== prevProps.timeScaleChangeUnit)) {
        this.setCustomIntervalText();
      }
    }
  }

  render() {
    let { customIntervalText, toolTipHovered } = this.state;
    let { customSelected, timeScaleChangeUnit } = this.props;
    return (
      <React.Fragment>
        <div id="zoom-btn-container"
        className="noselect"
        onMouseEnter={() => this.toggleTooltipHover(true)}
        onMouseLeave={() => this.toggleTooltipHover(false)}
        >
          {/* timeScale display */}
          <span
            id="current-zoom"
            className={`zoom-btn zoom-btn-active${customSelected ? ' custom-interval-text' : ''}`}
          >
            {customSelected ? customIntervalText : 1 + ' ' + timeScaleChangeUnit}
          </span>

          {/* hover timeScale unit dialog / entry point to Custom selector */}
          <div className="wv-tooltip"
          style={{ display: toolTipHovered ? 'block' : 'none' }}
          >
            <div id="timeline-zoom" className="timeline-zoom">
              <span
                id="zoom-years"
                className="zoom-btn zoom-btn-inactive zoom-years"
                onClick={() => this.handleClickZoom('year')}
              >
                Year
              </span>
              <span
                id="zoom-months"
                className="zoom-btn zoom-btn-inactive zoom-months"
                onClick={() => this.handleClickZoom('month')}
              >
                Month
              </span>
              <span
                id="zoom-days"
                className="zoom-btn zoom-btn-inactive zoom-days"
                onClick={() => this.handleClickZoom('day')}
              >
                Day
              </span>
              <span
                id="zoom-hours"
                className="zoom-btn zoom-btn-inactive zoom-hours"
                onClick={() => this.handleClickZoom('hour')}
              >
                Hour
              </span>
              <span
                id="zoom-minutes"
                className="zoom-btn zoom-btn-inactive zoom-minutes"
                onClick={() => this.handleClickZoom('minute')}
              >
                Minute
              </span>
              <span
                id="zoom-custom"
                className="zoom-btn zoom-btn-inactive zoom-custom custom-interval-text"
                style={{ display: customIntervalText === 'Custom' ? 'none' : 'block' }}
                onClick={() => this.handleClickZoom('custom')}
              >
                {customIntervalText}
              </span>
              <span
                id="zoom-custom-static"
                className="zoom-btn zoom-btn-inactive zoom-custom custom-interval-text"
                onClick={() => this.handleClickZoom('custom', true)}
              >
                Custom
              </span>
            </div>
          </div>
        </div>

      </React.Fragment>
    );
  }
}

TimeScaleIntervalChange.propTypes = {
  customDelta: PropTypes.number,
  customIntervalText: PropTypes.string,
  customSelected: PropTypes.bool,
  setTimeScaleIntervalChangeUnit: PropTypes.func,
  timeScaleChangeUnit: PropTypes.string
};

export default TimeScaleIntervalChange;
