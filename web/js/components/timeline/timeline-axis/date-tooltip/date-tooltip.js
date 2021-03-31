import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { getDaysInYear } from '../../date-util';

/**
* @desc helper function to format date string for tooltip display
* @param {String} time
* @param {Boolean} hasSubdailyLayers
* @returns {String} formatted yearMonthDay -OR- yearMonthDayHourMin (subdaily)
*/
const getTooltipTime = (time, hasSubdailyLayers) => {
  const timeSplit = time.split('T');
  const yearMonthDay = timeSplit[0];

  // if no subdaily, return YEAR-MON-DAY / 2020-02-15
  if (!hasSubdailyLayers) {
    return yearMonthDay;
  }

  const hourMinSecZ = timeSplit[1].split(':');
  const hourMinZ = `${[hourMinSecZ[0], hourMinSecZ[1]].join(':')}Z`;
  const yearMonthDayHourMin = `${yearMonthDay} ${hourMinZ}`;

  // if subdaily, return YEAR-MON-DAY HOUR-MIN-Z / 2020-02-15 18:00Z
  return yearMonthDayHourMin;
};

/*
 * Date tooltip for hover and draggers
 *
 * @class DateTooltip
 * @extends Component
 */
class DateTooltip extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showTooltip: false,
    };
    this.showTooltipTimeout = 0;
  }

  componentDidMount() {
    this.displayAndTimeoutTooltip();
  }

  componentDidUpdate(prevProps) {
    const {
      hoverTime,
      selectedDate,
      showDraggerTime,
      showHoverLine,
    } = this.props;

    const hoverTimeChange = hoverTime !== prevProps.hoverTime;
    const selectedDateChange = selectedDate !== prevProps.selectedDate;
    const isShowHover = showHoverLine || showDraggerTime;
    if (hoverTimeChange) {
      clearTimeout(this.showTooltipTimeout);
      this.updateTooltipDisplayState(false);
    } else if (selectedDateChange && !isShowHover) {
      this.displayAndTimeoutTooltip();
    }
  }

  componentWillUnmount() {
    // clear pending timeout
    clearTimeout(this.showTooltipTimeout);
  }

  updateTooltipDisplayState = (shouldDisplay) => {
    this.setState({
      showTooltip: shouldDisplay,
    });
  }

  displayAndTimeoutTooltip = () => {
    clearTimeout(this.showTooltipTimeout);
    this.updateTooltipDisplayState(true);
    this.showTooltipTimeout = setTimeout(() => {
      this.updateTooltipDisplayState(false);
    }, 1800);
  }

  getTooltipStyle = (dayOfYear, showDraggerTooltip, showHoverTooltip) => {
    const { showTooltip } = this.state;
    const {
      activeLayers,
      axisWidth,
      hasSubdailyLayers,
      isTimelineLayerCoveragePanelOpen,
      leftOffset,
      selectedDraggerPosition,
      shouldIncludeHiddenLayers,
    } = this.props;
    let tooltipLeftOffset;
    let display;
    let tooltipHeightOffset;

    if (showTooltip || showDraggerTooltip) {
      tooltipLeftOffset = selectedDraggerPosition - (hasSubdailyLayers ? 85 : 52);
      display = selectedDraggerPosition > -49 && selectedDraggerPosition < axisWidth - 49
        ? 'block'
        : 'none';
    } else if (showHoverTooltip) {
      tooltipLeftOffset = hasSubdailyLayers
        ? leftOffset - 134
        : leftOffset - 101;
      display = 'block';
    }

    tooltipHeightOffset = -100;
    if (isTimelineLayerCoveragePanelOpen) {
      tooltipHeightOffset = -136;
      const layers = activeLayers.filter((layer) => (shouldIncludeHiddenLayers
        ? layer.startDate
        : layer.startDate && layer.visible));
      // min 1 layer for error message display
      const layerLengthCoef = Math.max(layers.length, 1);
      const addHeight = Math.min(layerLengthCoef, 5) * 40;
      tooltipHeightOffset -= addHeight;
      tooltipHeightOffset = Math.max(tooltipHeightOffset, -357);
    }

    const width = hasSubdailyLayers
      ? dayOfYear >= 100
        ? 274
        : 267
      : 200;

    return {
      transform: `translate(${tooltipLeftOffset}px, ${tooltipHeightOffset}px)`,
      display,
      width: `${width}px`,
    };
  }

  render() {
    const { showTooltip } = this.state;
    const {
      hasSubdailyLayers,
      hoverTime,
      selectedDate,
      showDraggerTime,
      showHoverLine,
    } = this.props;
    // checks for dragger and hover handled by parent
    const showDraggerTooltip = !!(showDraggerTime && selectedDate);
    const showHoverTooltip = !!(showHoverLine && hoverTime);
    const shouldDisplayDraggerTooltip = showTooltip || showDraggerTooltip || showHoverTooltip;

    let tooltipDate;
    let dayOfYear;

    if (showTooltip || showDraggerTooltip) {
      // handle dragger tooltip
      tooltipDate = getTooltipTime(selectedDate, hasSubdailyLayers);
      dayOfYear = getDaysInYear(selectedDate);
    } else if (showHoverTooltip) {
      // handle hover tooltip
      tooltipDate = getTooltipTime(hoverTime, hasSubdailyLayers);
      dayOfYear = getDaysInYear(hoverTime);
    }

    const tooltipStyle = this.getTooltipStyle(dayOfYear, showDraggerTooltip, showHoverTooltip);

    // add leading zero for single digits
    dayOfYear = dayOfYear < 10
      ? `0${dayOfYear}`
      : dayOfYear;

    return (
      shouldDisplayDraggerTooltip && (
        <div
          className="date-tooltip"
          style={tooltipStyle}
        >
          { tooltipDate }
          {' '}
          <span className="date-tooltip-day">
            (
            { `DOY ${dayOfYear}` }
            )
          </span>
        </div>
      )
    );
  }
}

DateTooltip.propTypes = {
  activeLayers: PropTypes.array,
  axisWidth: PropTypes.number,
  hasSubdailyLayers: PropTypes.bool,
  hoverTime: PropTypes.string,
  isTimelineLayerCoveragePanelOpen: PropTypes.bool,
  leftOffset: PropTypes.number,
  selectedDate: PropTypes.string,
  selectedDraggerPosition: PropTypes.number,
  shouldIncludeHiddenLayers: PropTypes.bool,
  showDraggerTime: PropTypes.bool,
  showHoverLine: PropTypes.bool,
};

export default DateTooltip;
