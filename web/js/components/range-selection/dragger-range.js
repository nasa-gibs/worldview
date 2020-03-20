import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';
import { timeScaleOptions } from '../../modules/date/constants';
/*
 * A react component, is a draggable svg
 * rect element
 *
 * @class TimelineDraggerRange
 */
class TimelineDraggerRange extends PureComponent {
  /*
   * @constructor
   */
  constructor(props) {
    super(props);
    this.state = {
      width: 0,
      startLocation: this.props.startLocation,
      previousStartLocation: this.props.startLocation,
    };

    this.handleDrag = this.handleDrag.bind(this);
    this.handleDraggerClick = this.handleDraggerClick.bind(this);
  }

  /*
   * Resize timeline dragger width
   *
   * @method checkWidth
   *
   * @return {void}
   */
  checkWidth() {
    let start = this.props.startLocation;
    let end = this.props.endLocation;
    const max = this.props.max.width;
    let width;

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
      width,
      startLocation: start,
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
    const {
      endLocation,
      max,
      startLocation,
      timelineEndDateLimit,
      timeScale,
    } = this.props;
    let { endLocationDate } = this.props;
    let timelineEndDate = new Date(timelineEndDateLimit);

    // milliseconds to determine # of time units from end based on timeScale
    let { scaleMs } = timeScaleOptions[timeScale].timeAxis;
    // threshold for scaleMs to buffer if below
    let bufferCoeff = 20;

    // used to determine when to init buffer for variable MS month/year time units
    if (!scaleMs) {
      if (timeScale === 'month') {
        // 12 months
        scaleMs = 86400000 * 31;
        bufferCoeff = 12;
      }
      if (timeScale === 'year') {
        // 5 years
        scaleMs = 86400000 * 365;
        bufferCoeff = 5;
      }
    }

    // +/- {number} - change in x - set to 0 to 'stop' dragger movement - min/max of -55/55 to prevent overdrag
    let deltaX = d.deltaX < -55 ? -55 : d.deltaX > 55 ? 55 : d.deltaX;
    // +/- {number} - start position
    const deltaStart = d.x;

    // difference between end dragger and end of timeline in MS
    const endDateToLimitDifference = timelineEndDate.getTime() - endLocationDate.getTime();
    // determine if needs to be throttled
    const timeUnitsTillEnd = endDateToLimitDifference / scaleMs;
    const needDeltaThrottle = timeUnitsTillEnd < bufferCoeff;

    // format dates to ISO for comparison
    endLocationDate = `${endLocationDate.toISOString().split('.')[0]}Z`;
    timelineEndDate = `${timelineEndDate.toISOString().split('.')[0]}Z`;

    // timeline dragger dragged into the future (to the right)
    if (deltaX > 0) {
      // stop dragger if reached end date
      if (endLocationDate >= timelineEndDate) {
        deltaX = 0;
      // if end of timeline date is within view - rely on max
      } else if (max.end) {
        // timeline dragger dragged to max future of current viewable timeline
        if (endLocation >= max.width || endLocation > max.width - deltaX) {
          deltaX = 0;
        }
        // end of timeline date is not within view - rely on dates
      } else if (needDeltaThrottle) {
        // use buffer to start slowing down allowed deltaX to prevent overdrag
        deltaX = Math.min(deltaX, Math.abs(timeUnitsTillEnd * 2));
      }
    // timeline dragger dragged into the past (to the left)
    } else if (max.start) {
      // timeline dragger dragged to min past of current viewable timeline
      if (startLocation + deltaX - max.startOffset <= 0) {
        deltaX = 0;
      }
    }

    this.props.onDrag(deltaX, deltaStart);
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
    }
    return this.props.startLocation - this.props.deltaStart;
  }

  /*
   * Handle click within dragger range for drag vs timeline dragger click behavior
   * used in rect as onClick
   *
   * @method handleDraggerClick
   *
   * @return {void}
   */
  handleDraggerClick(e) {
    e.preventDefault();
    // compare start locations to check if range has been dragged vs. clicked
    if (
      this.state.startLocation.toFixed(3)
      !== this.state.previousStartLocation.toFixed(3)
    ) {
      this.setState((prevState) => ({
        previousStartLocation: prevState.startLocation,
      }));
    }
  }

  componentDidMount() {
    this.checkWidth();
  }

  // update state - used in componentDidUpdate
  updateExtent(nextProps) {
    this.setState({
      startLocation: nextProps.startLocation,
    });
  }

  componentDidUpdate(prevProps) {
    // update state and checkWidth only on startLocation and/or endLocation changes
    if (
      prevProps.startLocation !== this.props.startLocation
      || prevProps.endLocation !== this.props.endLocation
    ) {
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
        defaultPosition={{ x: 0, y: 11 }}
        onStop={this.props.onStop}
        onDrag={this.handleDrag}
      >
        <rect
          x={this.handleStartPositionRestriction()}
          fill={this.props.color}
          width={this.state.width}
          style={{
            fillOpacity: this.props.opacity,
            cursor: 'pointer',
          }}
          height={this.props.height}
          className="dragger-range"
          id={this.props.draggerID}
          onClick={this.handleDraggerClick}
        />
      </Draggable>
    );
  }
}

TimelineDraggerRange.propTypes = {
  color: PropTypes.string,
  deltaStart: PropTypes.number,
  draggerID: PropTypes.string,
  endLocation: PropTypes.number,
  endLocationDate: PropTypes.object,
  height: PropTypes.number,
  id: PropTypes.string,
  max: PropTypes.object,
  onDrag: PropTypes.func,
  onStop: PropTypes.func,
  opacity: PropTypes.number,
  startLocation: PropTypes.number,
  startLocationDate: PropTypes.object,
  timelineEndDateLimit: PropTypes.string,
  timeScale: PropTypes.string,
  width: PropTypes.number,
};

export default TimelineDraggerRange;
