import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

/*
 * Change timescale interval (time unit) by selecting from default timescales
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

  // Interval select tooltip on
  toolTipHoverOn = () => {
    this.setState({
      toolTipHovered: true
    });
  }

  // Interval select tooltip off
  toolTipHoverOff = () => {
    this.setState({
      toolTipHovered: false
    });
  }

  // handle click of timescale intervals
  handleClickInterval = (timescale, openDialog = false) => {
    // send props function to change timescale interval throughout app
    this.setState({
      toolTipHovered: false
    }, this.props.setTimeScaleIntervalChangeUnit(timescale, openDialog));
  }

  // individual linking timescale handlers
  handleClickIntervalYear = () => {
    this.handleClickInterval('year');
  }
  handleClickIntervalMonth = () => {
    this.handleClickInterval('month');
  }
  handleClickIntervalDay= () => {
    this.handleClickInterval('day');
  }
  handleClickIntervalHour = () => {
    this.handleClickInterval('hour');
  }
  handleClickIntervalMinute = () => {
    this.handleClickInterval('minute');
  }
  handleClickIntervalCustom = () => {
    this.handleClickInterval('custom');
  }
  handleClickIntervalCustomStatic = () => {
    this.handleClickInterval('custom', true);
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
    if (customSelected && customDelta && timeScaleChangeUnit) {
      const didCustomDeltaChange = customDelta !== prevProps.customDelta;
      const didTimeScaleChangeUnitChange = timeScaleChangeUnit !== prevProps.timeScaleChangeUnit;
      if (didCustomDeltaChange || didTimeScaleChangeUnitChange) {
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
      hasSubdailyLayers,
      timeScaleChangeUnit
    } = this.props;
    return (
      <React.Fragment>
        <div id="timeline-interval-btn-container"
          className="interval-btn-container noselect"
          onMouseEnter={this.toolTipHoverOn}
          onMouseLeave={this.toolTipHoverOff}
        >
          {/* timeScale display */}
          <span
            id="current-interval"
            className={`interval-btn interval-btn-active${customSelected ? ' custom-interval-text' : ''}`}
          >
            {customSelected ? customIntervalText : 1 + ' ' + timeScaleChangeUnit}
          </span>

          {/* hover timeScale unit dialog / entry point to Custom selector */}
          <div className="wv-tooltip"
            style={{ display: toolTipHovered ? 'block' : 'none' }}
          >
            <div id="timeline-interval" className="timeline-interval">
              <span
                id="interval-years"
                className="interval-btn interval-years"
                onClick={this.handleClickIntervalYear}
              >
                Year
              </span>
              <span
                id="interval-months"
                className="interval-btn interval-months"
                onClick={this.handleClickIntervalMonth}
              >
                Month
              </span>
              <span
                id="interval-days"
                className="interval-btn interval-days"
                onClick={this.handleClickIntervalDay}
              >
                Day
              </span>
              {hasSubdailyLayers ? (
                <React.Fragment>
                  <span
                    id="interval-hours"
                    className="interval-btn interval-hours"
                    onClick={this.handleClickIntervalHour}
                  >
                    Hour
                  </span>
                  <span
                    id="interval-minutes"
                    className="interval-btn interval-minutes"
                    onClick={this.handleClickIntervalMinute}
                  >
                    Minute
                  </span>
                </React.Fragment>
              ) : null}
              <span
                id="interval-custom"
                className="interval-btn interval-custom custom-interval-text"
                style={{ display: customIntervalText === 'Custom' ? 'none' : 'block' }}
                onClick={this.handleClickIntervalCustom}
              >
                {customIntervalText}
              </span>
              <span
                id="interval-custom-static"
                className="interval-btn interval-custom custom-interval-text"
                onClick={this.handleClickIntervalCustomStatic}
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
  customIntervalZoomLevel: PropTypes.string,
  customSelected: PropTypes.bool,
  hasSubdailyLayers: PropTypes.bool,
  setTimeScaleIntervalChangeUnit: PropTypes.func,
  timeScaleChangeUnit: PropTypes.string
};

export default TimeScaleIntervalChange;
