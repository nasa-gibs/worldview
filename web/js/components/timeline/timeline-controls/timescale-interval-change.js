import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  TIME_SCALE_TO_NUMBER,
  TIME_SCALE_FROM_NUMBER,
} from '../../../modules/date/constants';
import {
  toggleCustomModal as toggleCustomModalAction,
  selectInterval as selectIntervalAction,
} from '../../../modules/date/actions';

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
    const { customDelta, customInterval } = this.props;
    if (customDelta !== 1 && customInterval) {
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

  setTooltipState = (hovered) => {
    const { isDisabled } = this.props;
    if (isDisabled) return;
    this.setState({
      toolTipHovered: hovered,
    });
  };

  onClick = () => {
    const { toolTipHovered } = this.state;
    this.setState({
      toolTipHovered: !toolTipHovered,
    });
  };

  handleClickInterval = (timescale, openModal = false) => {
    // send props function to change timescale interval throughout app
    this.setState({
      toolTipHovered: false,
    }, this.setTimeScaleIntervalChangeUnit(timescale, openModal));
  };

  /**
  * @desc handle SELECT of LEFT/RIGHT interval selection
  * @param {String} timeScale
  * @param {Boolean} modalOpen - is custom interval modal open
  */
  setTimeScaleIntervalChangeUnit = (timeScale, openModal) => {
    const {
      customInterval, customDelta, selectInterval, toggleCustomModal, modalType,
    } = this.props;
    const customSelected = timeScale === 'custom';
    let delta;
    let newTimeScale = timeScale;

    if (openModal) {
      toggleCustomModal(openModal, modalType);
      return;
    }

    if (customSelected && customInterval && customDelta) {
      newTimeScale = customInterval;
      delta = customDelta;
    } else {
      newTimeScale = Number(TIME_SCALE_TO_NUMBER[newTimeScale]);
      delta = 1;
    }
    selectInterval(delta, newTimeScale, customSelected);
  };

  // set custom text for custom interval
  setCustomIntervalText = () => {
    const { customDelta, customInterval } = this.props;
    this.setState({
      customIntervalText: `${customDelta} ${TIME_SCALE_FROM_NUMBER[customInterval]}`,
    });
  };

  // reset custom text for custom interval
  resetCustomIntervalText = () => {
    this.setState({
      customIntervalText: 'Custom',
    });
  };

  renderTooltip = () => {
    const { toolTipHovered, customIntervalText } = this.state;
    const { hasSubdailyLayers } = this.props;
    return (
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
    );
  };

  render() {
    const {
      customIntervalText,
    } = this.state;
    const {
      customSelected,
      interval,
      isDisabled,
    } = this.props;

    const className = `no-drag interval-btn interval-btn-active${customSelected ? ' custom-interval-text' : ''} ${isDisabled ? ' disabled' : ''}`;
    return (
      <div
        id="timeline-interval-btn-container"
        className="interval-btn-container noselect no-drag"
        onMouseEnter={() => this.setTooltipState(true)}
        onMouseLeave={() => this.setTooltipState(false)}
        onClick={this.onClick}
      >

        <span
          id="current-interval"
          className={className}
        >
          {customSelected ? customIntervalText : `${1} ${TIME_SCALE_FROM_NUMBER[interval]}`}
        </span>

        {!isDisabled ? this.renderTooltip() : null}

      </div>
    );
  }
}

const mapDispatchToProps = (dispatch) => ({
  toggleCustomModal: (isOpen, modalType) => {
    dispatch(toggleCustomModalAction(isOpen, modalType));
  },
  selectInterval: (delta, timeScale, customSelected) => {
    dispatch(selectIntervalAction(delta, timeScale, customSelected));
  },
});

const mapStateToProps = (state) => {
  const { date } = state;
  const {
    interval, customInterval, customDelta, customSelected,
  } = date;
  return {
    interval,
    customInterval,
    customDelta,
    customSelected,
  };
};

TimeScaleIntervalChange.propTypes = {
  customDelta: PropTypes.number,
  customInterval: PropTypes.number,
  customSelected: PropTypes.bool,
  hasSubdailyLayers: PropTypes.bool,
  interval: PropTypes.number,
  isDisabled: PropTypes.bool,
  selectInterval: PropTypes.func,
  timeScaleChangeUnit: PropTypes.string,
  toggleCustomModal: PropTypes.func,
  modalType: PropTypes.string,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(TimeScaleIntervalChange);
