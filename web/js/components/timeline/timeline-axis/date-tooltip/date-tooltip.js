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
      draggerSelected,
      draggerPosition,
      draggerPositionB,
      hasSubdailyLayers,
      leftOffset,
      showDraggerTime,
      draggerTimeState,
      draggerTimeStateB,
      hoverTime,
      showHoverLine,
      axisWidth,
    } = this.props;
    // checks for dragger and hover handled by parent
    const showDraggerToolTip = !!(showDraggerTime && draggerTimeState);
    const showHoverToolTip = !!(showHoverLine && hoverTime);

    let toolTipLeftOffest;
    let toolTipDate;
    let toolTipDayOfYear;
    let toolTipDisplay;

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
      toolTipLeftOffest = position - (hasSubdailyLayers ? 68 : 35);
      toolTipDate = getToolTipTime(draggerTime, hasSubdailyLayers);
      toolTipDayOfYear = getDaysInYear(draggerTime);
      toolTipDisplay = position > -49 && position < axisWidth - 49 ? 'block' : 'none';
    } else if (showHoverToolTip) {
      // handle hover tooltip
      toolTipLeftOffest = hasSubdailyLayers ? leftOffset - 117 : leftOffset - 84;
      toolTipDate = getToolTipTime(hoverTime, hasSubdailyLayers);
      toolTipDayOfYear = getDaysInYear(hoverTime);
      toolTipDisplay = 'block';
    }
    return (
      <>
        { (showDraggerToolTip || showHoverToolTip)
        && (
        <div
          className="date-tooltip"
          style={{
            transform: `translate(${toolTipLeftOffest}px, -100px)`,
            display: toolTipDisplay,
            width: hasSubdailyLayers
              ? toolTipDayOfYear >= 100
                ? '239px'
                : '232px'
              : '165px',
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
        )}
      </>
    );
  }
}

DateToolTip.propTypes = {
  axisWidth: PropTypes.number,
  draggerPosition: PropTypes.number,
  draggerPositionB: PropTypes.number,
  draggerSelected: PropTypes.string,
  draggerTimeState: PropTypes.string,
  draggerTimeStateB: PropTypes.string,
  hasSubdailyLayers: PropTypes.bool,
  hoverTime: PropTypes.string,
  leftOffset: PropTypes.number,
  showDraggerTime: PropTypes.bool,
  showHoverLine: PropTypes.bool,
};

export default DateToolTip;
