import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { getDaysInYear } from '../../date-util';

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
      axisWidth
    } = this.props;
    // checks for dragger and hover handled by parent
    const showDraggerToolTip = !!(showDraggerTime && draggerTimeState);
    const showHoverToolTip = !!(showHoverLine && hoverTime);

    let toolTipLeftOffest;
    let toolTipDate;
    let toolTipDayOfYear;
    let toolTipDisplay;

    if (showDraggerToolTip) { // handle dragger tooltip
      // determine A or B dragger and set variables
      let draggerTime;
      let position;
      if (draggerSelected === 'selected') {
        draggerTime = draggerTimeState;
        position = draggerPosition;
      } else {
        draggerTime = draggerTimeStateB;
        position = draggerPositionB;
      }
      toolTipLeftOffest = position - (hasSubdailyLayers ? 87 : 35);
      toolTipDate = hasSubdailyLayers ? draggerTime.split('T').join(' ') : draggerTime.split('T')[0];
      toolTipDayOfYear = getDaysInYear(draggerTime);
      toolTipDisplay = position > -49 && position < axisWidth - 49 ? 'block' : 'none';
    } else if (showHoverToolTip) { // handle hover tooltip
      toolTipLeftOffest = hasSubdailyLayers ? leftOffset - 136 : leftOffset - 84;
      toolTipDate = hasSubdailyLayers ? hoverTime.split('T').join(' ') : hoverTime.split('T')[0];
      toolTipDayOfYear = getDaysInYear(hoverTime);
      toolTipDisplay = 'block';
    }
    return (
      <React.Fragment>
        {
          (showDraggerToolTip) || (showHoverToolTip)
            ? <div
              className="date-tooltip"
              style={{
                transform: `translate(${toolTipLeftOffest}px, -100px)`,
                display: toolTipDisplay,
                width: hasSubdailyLayers ? '270px' : '165px'
              }}
            >
              { toolTipDate } <span className="date-tooltip-day">({ toolTipDayOfYear })</span>
            </div>
            : null
        }
      </React.Fragment>
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
  showHoverLine: PropTypes.bool
};

export default DateToolTip;
