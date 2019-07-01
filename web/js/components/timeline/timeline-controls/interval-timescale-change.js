import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

/*
 * Change timescale interval (zoom level) by selecting from default timescales
 * and custom (if available) in tooltip visible upon hover of current timescale
 * above the LEFT/RIGHT increment arrows (ex: hover over '1 day' for example)
 *
 * @class TimeScaleIntervalChange
 * @extends PureComponent
 */
class TimeScaleIntervalChange extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      toolTipHovered: false,
      customIntervalText: 'Custom'
    };
  }

  // Zoom select tooltip on
  toolTipHoverOn = () => {
    this.setState({
      toolTipHovered: true
    });
  }

  // Zoom select tooltip off
  toolTipHoverOff = () => {
    this.setState({
      toolTipHovered: false
    });
  }

  // handle click zoom of timescale intervals
  handleClickZoom = (timescale, openDialog = false) => {
    // send props function to change timescale zoom level throughout app
    this.setState({
      toolTipHovered: false
    }, this.props.setTimeScaleIntervalChangeUnit(timescale, openDialog));
  }

  // individual linking timescale handlers
  handleClickZoomYear = () => {
    this.handleClickZoom('year');
  }
  handleClickZoomMonth = () => {
    this.handleClickZoom('month');
  }
  handleClickZoomDay= () => {
    this.handleClickZoom('day');
  }
  handleClickZoomHour = () => {
    this.handleClickZoom('hour');
  }
  handleClickZoomMinute = () => {
    this.handleClickZoom('minute');
  }
  handleClickZoomCustom = () => {
    this.handleClickZoom('custom');
  }
  handleClickZoomCustomStatic = () => {
    this.handleClickZoom('custom', true);
  }

  // set custom text for custom interval
  setCustomIntervalText = () => {
    this.setState({
      customIntervalText: this.props.customDelta + ' ' + this.props.customIntervalZoomLevel
    });
  }

  componentDidMount () {
    if (this.props.customDelta !== 1 && this.props.customIntervalZoomLevel) {
      this.setCustomIntervalText();
    }
  }

  componentDidUpdate (prevProps) {
    let {
      customDelta,
      timeScaleChangeUnit,
      customSelected
    } = this.props;
    if (customDelta && timeScaleChangeUnit) {
      if (customSelected && customDelta !== 1 && this.state.customIntervalText === 'Custom') {
        this.setCustomIntervalText();
      } else if (customSelected && (customDelta !== prevProps.customDelta || timeScaleChangeUnit !== prevProps.timeScaleChangeUnit)) {
        this.setCustomIntervalText();
      }
    }
  }

  render() {
    let {
      customIntervalText,
      toolTipHovered
    } = this.state;
    let {
      customSelected,
      timeScaleChangeUnit
    } = this.props;
    return (
      <React.Fragment>
        <div id="zoom-btn-container"
          className="noselect"
          onMouseEnter={this.toolTipHoverOn}
          onMouseLeave={this.toolTipHoverOff}
        >
          {/* timeScale display */}
          <span
            id="current-interval"
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
                onClick={this.handleClickZoomYear}
              >
                Year
              </span>
              <span
                id="zoom-months"
                className="zoom-btn zoom-btn-inactive zoom-months"
                onClick={this.handleClickZoomMonth}
              >
                Month
              </span>
              <span
                id="zoom-days"
                className="zoom-btn zoom-btn-inactive zoom-days"
                onClick={this.handleClickZoomDay}
              >
                Day
              </span>
              <span
                id="zoom-hours"
                className="zoom-btn zoom-btn-inactive zoom-hours"
                onClick={this.handleClickZoomHour}
              >
                Hour
              </span>
              <span
                id="zoom-minutes"
                className="zoom-btn zoom-btn-inactive zoom-minutes"
                onClick={this.handleClickZoomMinute}
              >
                Minute
              </span>
              <span
                id="zoom-custom"
                className="zoom-btn zoom-btn-inactive zoom-custom custom-interval-text"
                style={{ display: customIntervalText === 'Custom' ? 'none' : 'block' }}
                onClick={this.handleClickZoomCustom}
              >
                {customIntervalText}
              </span>
              <span
                id="zoom-custom-static"
                className="zoom-btn zoom-btn-inactive zoom-custom custom-interval-text"
                onClick={this.handleClickZoomCustomStatic}
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
  timeScaleChangeUnit: PropTypes.string,
  customDelta: PropTypes.number,
  customIntervalZoomLevel: PropTypes.string,
  customSelected: PropTypes.bool,
  setTimeScaleIntervalChangeUnit: PropTypes.func
};

export default TimeScaleIntervalChange;
