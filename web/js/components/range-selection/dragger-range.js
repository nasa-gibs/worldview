import React from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';
/*
 * A react component, is a draggable svg
 * rect element
 *
 * @class TimelineDraggerRange
 */
class TimelineDraggerRange extends React.Component {
  /*
   * @constructor
   */
  constructor(props) {
    super(props);
    this.state = {
      width: 0,
      startLocation: this.props.startLocation,
      endLocation: this.props.endLocation,
      previousStartLocation: this.props.startLocation
    };
  }
  /*
  * Resize timeline dragger width
  *
  * @method checkWidth
  *
  * @return {void}
  */
  checkWidth() {
    var start = this.props.startLocation;
    var end = this.props.endLocation;
    var max = this.props.max.width;
    var width;

    if (start < 0) {
      start = 0;
    }
    if (end > max) {
      end = max;
    }
    width = end - start;
    if (width < 0) {
      width = 0;
    }
    this.setState({
      width: width,
      startLocation: start
    });
  }
  /*
   * When the component is dragged,
   * this function passes the id
   * and change in x of the drag
   * to onDrag property
   *
   * @method handleDrag
   *
   * @param {object} e - event object
   * @param {object} d - Draggable object
   *
   * @return {void}
   */
  handleDrag(e, d) {
    e.preventDefault();
    e.stopPropagation();
    // +/- {number} - change in x - set to 0 to 'stop' dragger movement - min/max of -55/55 to prevent overdrag
    let deltaX = d.deltaX < -55 ? -55 : (d.deltaX > 55 ? 55 : d.deltaX);
    // +/- {number} - start position
    let deltaStart = d.x;
    let startLocationDate = new Date(this.props.startLocationDate);
    let endLocationDate = new Date(this.props.endLocationDate);
    let timelineEndDate = new Date(this.props.timelineEndDateLimit);
    // used to determine and buffer large monthly/yearly ranges
    let startDateToEndDifference = this.dateDifferenceInDays(startLocationDate, endLocationDate);
    if (startDateToEndDifference > 100) {
      startDateToEndDifference = 300;
    }
    // difference between last date on timeline (current day/now) and end date dragger
    let endDateToLimitDifference = Math.min(startDateToEndDifference, this.dateDifferenceInDays(endLocationDate, timelineEndDate));
    // match end date precise time units to dragging end date
    let timelineEndDateLimitMatch = new Date(
      timelineEndDate.getFullYear(),
      timelineEndDate.getMonth(),
      timelineEndDate.getDate(),
      endLocationDate.getHours(),
      endLocationDate.getMinutes()
    );
    // match buffer date precise time units to dragging end date - calculated endDateToLimitDifference used dynamically
    // to change buffer dates of when to limit deltaX and therefore slow down dragger speed
    let timelineMaxDateBufferMatch = new Date(
      timelineEndDate.getFullYear(),
      timelineEndDate.getMonth(),
      timelineEndDate.getDate() - Math.abs(endDateToLimitDifference),
      endLocationDate.getHours(),
      endLocationDate.getMinutes()
    );

    // format dates to ISO for comparison
    endLocationDate = endLocationDate.toISOString().split('.')[0] + 'Z';
    timelineEndDateLimitMatch = timelineEndDateLimitMatch.toISOString().split('.')[0] + 'Z';
    timelineMaxDateBufferMatch = timelineMaxDateBufferMatch.toISOString().split('.')[0] + 'Z';

    // timeline dragger dragged into the future (to the right)
    if (deltaX > 0) {
      // stop dragger if reached end date
      if (endLocationDate >= timelineEndDateLimitMatch) {
        deltaX = 0;
      } else {
        // if end of timeline date is within view - rely on max
        if (this.props.max.end) {
          // timeline dragger dragged to max future of current viewable timeline
          if (this.props.endLocation >= this.props.max.width) {
            deltaX = 0;
          }
          if (this.props.endLocation > this.props.max.width - deltaX) {
            deltaX = 0;
          }
        // end of timeline date is not within view - rely on dates
        } else {
          // use buffer to start slowing down allowed deltaX to prevent overdrag
          if (endLocationDate >= timelineMaxDateBufferMatch) {
            deltaX = Math.min(deltaX, Math.abs(endDateToLimitDifference * 2));
          }
        }
      }
    // timeline dragger dragged into the past (to the left)
    } else {
      if (this.props.max.start) {
        // timeline dragger dragged to min past of current viewable timeline
        if (this.props.startLocation + deltaX - this.props.max.startOffset <= 0) {
          deltaX = 0;
        }
      }
    }
    this.props.onDrag(deltaX, deltaStart, this.props.id);
  }

  /*
  * Utility function to caculate difference between two dates
  * put cutoff date as dateA for min (dateA hours & minutes used for both), and dateB for max
  *
  * @method dateDifferenceInDays
  *
  * @return {number}
  */
  dateDifferenceInDays(dateA, dateB) {
    const msPerDay = 1000 * 60 * 60 * 24;
    // Discard the time and time-zone information.
    const utc1 = Date.UTC(dateA.getFullYear(), dateA.getMonth(), dateA.getDate());
    const utc2 = Date.UTC(dateB.getFullYear(), dateB.getMonth(), dateB.getDate(), dateA.getHours(), dateA.getMinutes());

    return Math.floor((utc2 - utc1) / msPerDay);
  }

  /*
  * Handle dragging timeline and syncing start position of dragger range
  * used in rect to return x
  *
  * @method handleStartPositionRestriction
  *
  * @return {number}
  */
  handleStartPositionRestriction() {
    // if startLocation is in the past prior to min past of current viewable timeline
    if (this.props.startLocation <= 0) {
      return -this.props.deltaStart;
    } else {
      return this.props.startLocation - this.props.deltaStart;
    }
  }

  /*
  * Handle click within dragger range for drag vs guitarpick click behavior
  * used in rect as onClick
  *
  * @method handleDraggerClick
  *
  * @return {void}
  */
  handleDraggerClick(e) {
    // compare start locations to check if range has been dragged vs. clicked
    if (this.state.startLocation.toFixed(3) === this.state.previousStartLocation.toFixed(3)) {
      this.props.onClick(e);
    } else {
      this.setState({ previousStartLocation: this.state.startLocation });
    }
  }

  componentDidMount () {
    this.checkWidth();
  }

  // update state - used in componentDidUpdate
  updateExtent(nextProps) {
    this.setState({
      startLocation: nextProps.startLocation,
      endLocation: nextProps.endLocation
    });
  }

  componentDidUpdate (prevProps) {
    // update state and checkWidth only on startLocation and/or endLocation changes
    if (prevProps.startLocation !== this.props.startLocation || prevProps.endLocation !== this.props.endLocation) {
      this.updateExtent(this.props);
      this.checkWidth();
    }
  }
  /*
   * @method render
   */
  render() {
    return (
      <Draggable
        handle=".dragger-range"
        axis="x"
        position={null}
        defaultPosition={{ x: 0, y: 0 }}
        onStop={this.props.onStop}
        onDrag={this.handleDrag.bind(this)}
      >
        <rect
          x={this.handleStartPositionRestriction()}
          fill={this.props.color}
          width={this.state.width}
          style={{
            fillOpacity: this.props.opacity,
            cursor: 'pointer'
          }}
          height={this.props.height}
          className='dragger-range'
          id={this.props.draggerID}
          onClick={this.handleDraggerClick.bind(this)}
        />
      </Draggable>
    );
  }
}

TimelineDraggerRange.propTypes = {
  opacity: PropTypes.number,
  startLocation: PropTypes.number,
  endLocation: PropTypes.number,
  startLocationDate: PropTypes.string,
  endLocationDate: PropTypes.string,
  timelineStartDateLimit: PropTypes.string,
  timelineEndDateLimit: PropTypes.string,
  deltaStart: PropTypes.number,
  max: PropTypes.object,
  height: PropTypes.number,
  width: PropTypes.number,
  color: PropTypes.string,
  draggerID: PropTypes.string,
  onClick: PropTypes.func,
  onDrag: PropTypes.func,
  onStop: PropTypes.func,
  id: PropTypes.string
};

export default TimelineDraggerRange;
