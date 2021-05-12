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
      customIntervalText: 'Custom',
    };
  }

  componentDidMount() {
    const { customDelta, customIntervalZoomLevel } = this.props;
    if (customDelta !== 1 && customIntervalZoomLevel) {
      this.setCustomIntervalText();
    }
  }

  componentDidUpdate(prevProps) {
    const {
      customDelta,
      timeScaleChangeUnit,
      customSelected,
    } = this.props;
    const {
      customIntervalText,
    } = this.state;
    const isCustomIntervalTextSet = customIntervalText !== 'Custom';
    const defaultDelta = !customDelta || customDelta === 1;
    if (!customSelected && isCustomIntervalTextSet && (defaultDelta || !timeScaleChangeUnit)) {
      // reset from tour step change where previous step has custom interval and next step doesn't
      this.resetCustomIntervalText();
    } else if (customSelected && customDelta && timeScaleChangeUnit) {
      const didCustomDeltaChange = customDelta !== prevProps.customDelta;
      const didTimeScaleChangeUnitChange = timeScaleChangeUnit !== prevProps.timeScaleChangeUnit;
      if (didCustomDeltaChange || didTimeScaleChangeUnitChange) {
        this.setCustomIntervalText();
      }
    }
  }

  // Interval select tooltip on
  toolTipHoverOn = () => {
    this.setState({
      toolTipHovered: true,
    });
  }

  // Interval select tooltip off
  toolTipHoverOff = () => {
    this.setState({
      toolTipHovered: false,
    });
  }

  onClick = () => {
    const { toolTipHovered } = this.state;
    this.setState({
      toolTipHovered: !toolTipHovered,
    });
  }

  // handle click of timescale intervals
  handleClickInterval = (timescale, openModal = false) => {
    const { setTimeScaleIntervalChangeUnit } = this.props;
    // send props function to change timescale interval throughout app
    this.setState({
      toolTipHovered: false,
    }, setTimeScaleIntervalChangeUnit(timescale, openModal));
  }

  // set custom text for custom interval
  setCustomIntervalText = () => {
    const { customDelta, customIntervalZoomLevel } = this.props;
    this.setState({
      customIntervalText: `${customDelta} ${customIntervalZoomLevel}`,
    });
  }

  // reset custom text for custom interval
  resetCustomIntervalText = () => {
    this.setState({
      customIntervalText: 'Custom',
    });
  }

  render() {
    const {
      customIntervalText,
      toolTipHovered,
    } = this.state;
    const {
      customSelected,
      hasSubdailyLayers,
      timeScaleChangeUnit,
    } = this.props;
    return (
      <>
        <div
          id="timeline-interval-btn-container"
          className="interval-btn-container noselect no-drag"
          onMouseEnter={this.toolTipHoverOn}
          onMouseLeave={this.toolTipHoverOff}
          onClick={this.onClick}
        >
          {/* timeScale display */}
          <span
            id="current-interval"
            className={`no-drag interval-btn interval-btn-active${customSelected ? ' custom-interval-text' : ''}`}
          >
            {customSelected ? customIntervalText : `${1} ${timeScaleChangeUnit}`}
          </span>

          {/* hover timeScale unit dialog / entry point to Custom selector */}
          <div
            className="wv-tooltip"
            style={{ display: toolTipHovered ? 'block' : 'none' }}
          >
            <div id="timeline-interval" className="timeline-interval">
              <span
                id="interval-years"
                className="interval-btn interval-years"
                onClick={() => this.handleClickInterval('year')}
              >
                Year
              </span>
              <span
                id="interval-months"
                className="interval-btn interval-months"
                onClick={() => this.handleClickInterval('month')}
              >
                Month
              </span>
              <span
                id="interval-days"
                className="interval-btn interval-days"
                onClick={() => this.handleClickInterval('day')}
              >
                Day
              </span>
              {hasSubdailyLayers ? (
                <>
                  <span
                    id="interval-hours"
                    className="interval-btn interval-hours"
                    onClick={() => this.handleClickInterval('hour')}
                  >
                    Hour
                  </span>
                  <span
                    id="interval-minutes"
                    className="interval-btn interval-minutes"
                    onClick={() => this.handleClickInterval('minute')}
                  >
                    Minute
                  </span>
                </>
              ) : null}
              <span
                id="interval-custom"
                className="interval-btn interval-custom custom-interval-text"
                style={{ display: customIntervalText === 'Custom' ? 'none' : 'block' }}
                onClick={() => this.handleClickInterval('custom')}
              >
                {customIntervalText}
              </span>
              <span
                id="interval-custom-static"
                className="interval-btn interval-custom custom-interval-text"
                onClick={() => this.handleClickInterval('custom', true)}
              >
                Custom
              </span>
            </div>
          </div>
        </div>
      </>
    );
  }
}

TimeScaleIntervalChange.propTypes = {
  customDelta: PropTypes.number,
  customIntervalZoomLevel: PropTypes.string,
  customSelected: PropTypes.bool,
  hasSubdailyLayers: PropTypes.bool,
  setTimeScaleIntervalChangeUnit: PropTypes.func,
  timeScaleChangeUnit: PropTypes.string,
};

export default TimeScaleIntervalChange;
