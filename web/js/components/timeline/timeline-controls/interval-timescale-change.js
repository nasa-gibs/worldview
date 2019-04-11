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

  handleClickZoom = (intervalSelected) => {
    // close tooltip
    // send props function to change timescale zoom level throughout app
    this.setState({
      toolTipHovered: false,
    }, this.props.setTimeScaleIntervalChangeUnit(intervalSelected, intervalSelected === 'custom'));
  }

  // set custom text for custom interval
  setCustomIntervalText = () => {
    this.setState({
      customIntervalText: this.props.customIntervalValue + ' ' + this.props.customIntervalZoomLevel
    })
  }

  componentDidMount () {
    if (this.props.customIntervalValue !== 1) {
      this.setCustomIntervalText();
    }
  }

  componentDidUpdate (prevProps, prevState) {
    if (this.props.customIntervalValue && this.props.timeScaleChangeUnit) {
      if (this.props.customSelected && this.props.customIntervalValue !== 1 && this.state.customIntervalText === 'Custom') {
        this.setCustomIntervalText();
      } else if (this.props.customSelected && (this.props.customIntervalValue !== prevProps.customIntervalValue || this.props.timeScaleChangeUnit !== prevProps.timeScaleChangeUnit)) {
        this.setCustomIntervalText();
      }
    }
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
            className={`zoom-btn zoom-btn-active${this.props.customSelected ? ' custom-interval-text' : ''}`}
          >
            {this.props.customSelected ? this.state.customIntervalText : 1 + ' ' + this.props.timeScaleChangeUnit}
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
                onClick={() => this.handleClickZoom('custom')}
              >
                {this.state.customIntervalText}
              </span>
            </div>
          </div>
        </div>

      </React.Fragment>
    );
  }
}

TimeScaleIntervalChange.propTypes = {
  customIntervalValue: PropTypes.number,
  customIntervalText: PropTypes.string,
  customSelected: PropTypes.bool,
  setTimeScaleIntervalChangeUnit: PropTypes.func,
  timeScaleChangeUnit: PropTypes.string
};

export default TimeScaleIntervalChange;
