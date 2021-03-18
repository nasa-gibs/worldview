import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { getDaysInYear } from '../../date-util';

/**
* @desc helper function to format date string for tooltip display
* @param {String} time
* @param {Boolean} hasSubdailyLayers
* @returns {String} formatted yearMonthDay -OR- yearMonthDayHourMin (subdaily)
*/
const getToolTipTime = (time, hasSubdailyLayers) => {
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
 * @class DateToolTip
 * @extends PureComponent
 */
class DateToolTip extends PureComponent {
  render() {
    const {
      activeLayers,
      draggerSelected,
      draggerPosition,
      draggerPositionB,
      hasSubdailyLayers,
      leftOffset,
      showDraggerTime,
      draggerTimeState,
      draggerTimeStateB,
      hoverTime,
      isTimelineLayerCoveragePanelOpen,
      showHoverLine,
      shouldIncludeHiddenLayers,
      axisWidth,
    } = this.props;
    // checks for dragger and hover handled by parent
    const showDraggerToolTip = !!(showDraggerTime && draggerTimeState);
    const showHoverToolTip = !!(showHoverLine && hoverTime);
    const shouldDisplayDraggerToolTip = showDraggerToolTip || showHoverToolTip;

    let toolTipLeftOffset;
    let toolTipDate;
    let toolTipDayOfYear;
    let toolTipDisplay;
    let toolTipHeightOffset;

    if (showDraggerToolTip) {
      // handle dragger tooltip
      let draggerTime;
      let position;
      // determine A or B dragger and set variables
      if (draggerSelected === 'selected') {
        draggerTime = draggerTimeState;
        position = draggerPosition;
      } else {
        draggerTime = draggerTimeStateB;
        position = draggerPositionB;
      }
      toolTipLeftOffset = position - (hasSubdailyLayers ? 68 : 35);
      toolTipDate = getToolTipTime(draggerTime, hasSubdailyLayers);
      toolTipDayOfYear = getDaysInYear(draggerTime);
      toolTipDisplay = position > -49 && position < axisWidth - 49
        ? 'block'
        : 'none';
    } else if (showHoverToolTip) {
      // handle hover tooltip
      toolTipLeftOffset = hasSubdailyLayers
        ? leftOffset - 117
        : leftOffset - 84;
      toolTipDate = getToolTipTime(hoverTime, hasSubdailyLayers);
      toolTipDayOfYear = getDaysInYear(hoverTime);
      toolTipDisplay = 'block';
    }

    // handle active layer count dependent tooltip height
    toolTipHeightOffset = -100;
    if (isTimelineLayerCoveragePanelOpen) {
      toolTipHeightOffset = -136;
      const layers = activeLayers.filter((layer) => (shouldIncludeHiddenLayers
        ? layer.startDate
        : layer.startDate && layer.visible));
      // min 1 layer for error message display
      const layerLengthCoef = Math.max(layers.length, 1);
      const addHeight = Math.min(layerLengthCoef, 5) * 40;
      toolTipHeightOffset -= addHeight;
      toolTipHeightOffset = Math.max(toolTipHeightOffset, -357);
    }

    const toolTipWidth = hasSubdailyLayers
      ? toolTipDayOfYear >= 100
        ? '239px'
        : '232px'
      : '165px';

    // add leading zero for single digits
    toolTipDayOfYear = toolTipDayOfYear < 10
      ? `0${toolTipDayOfYear}`
      : toolTipDayOfYear;

    return (
      shouldDisplayDraggerToolTip && (
        <div
          className="date-tooltip"
          style={{
            transform: `translate(${toolTipLeftOffset}px, ${toolTipHeightOffset}px)`,
            display: toolTipDisplay,
            width: toolTipWidth,
          }}
        >
          { toolTipDate }
          {' '}
          <span className="date-tooltip-day">
            (
            { toolTipDayOfYear }
            )
          </span>
        </div>
      )
    );
  }
}

DateToolTip.propTypes = {
  activeLayers: PropTypes.array,
  axisWidth: PropTypes.number,
  draggerPosition: PropTypes.number,
  draggerPositionB: PropTypes.number,
  draggerSelected: PropTypes.string,
  draggerTimeState: PropTypes.string,
  draggerTimeStateB: PropTypes.string,
  hasSubdailyLayers: PropTypes.bool,
  hoverTime: PropTypes.string,
  isTimelineLayerCoveragePanelOpen: PropTypes.bool,
  leftOffset: PropTypes.number,
  shouldIncludeHiddenLayers: PropTypes.bool,
  showDraggerTime: PropTypes.bool,
  showHoverLine: PropTypes.bool,
};

export default DateToolTip;
