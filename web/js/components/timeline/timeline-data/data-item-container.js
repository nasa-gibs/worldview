import React, { Component } from 'react';
import PropTypes from 'prop-types';
import DataLine from './data-line';

/*
 * Data Item Container for individual layer data coverage.
 *
 * @class DataItemContainer
 */

class DataItemContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dataDateRanges: [],
    };
  }

  componentDidMount() {
    const { layer } = this.props;
    const { dateRanges } = layer;
    // handle date range query/array building
    const dateRangesToDisplay = this.getDateRangeToDisplay(dateRanges);
    this.updateDateRangeState(dateRangesToDisplay);

    // create data line

    // TODO: which state to store position related state for data line? pure component data line preferred
  }


  shouldComponentUpdate(nextProps, nextState) {
    return true;
  }

  componentDidUpdate(prevProps, prevState) {
    const { layer } = this.props;
    const { dateRanges } = layer;

    const frontDateChanged = prevProps.frontDate !== this.props.frontDate;
    const backDateChanged = prevProps.backDate !== this.props.backDate;
    // console.log(frontDateChanged, backDateChanged);

    if (frontDateChanged || backDateChanged) {
      const dateRangesToDisplay = this.getDateRangeToDisplay(dateRanges);
      this.updateDateRangeState(dateRangesToDisplay);
    }
  }

  /**
  * @desc getDateRangeToDisplay
  * @param {Array} dateRanges
  * @returns {ArrayBuffer} multiDateToDisplay
  */
  getDateRangeToDisplay = (dateRanges) => {
    const { getMaxEndDate, getDatesInDateRange, layer } = this.props;
    const { inactive } = layer;

    const multiDateToDisplay = dateRanges.reduce((mutliCoverageDates, range, innerIndex) => {
      const isLastInRange = innerIndex === dateRanges.length - 1;
      const rangeInterval = Number(range.dateInterval);
      // multi time unit range - no year time unit
      const endDateLimit = getMaxEndDate(inactive, isLastInRange);
      // get dates based on date ranges
      const dateIntervalStartDates = getDatesInDateRange(layer, range, endDateLimit, isLastInRange);
      // add date intervals to mutliCoverageDates object to catch repeats
      dateIntervalStartDates.forEach((dateInt) => {
        const dateIntFormatted = dateInt.toISOString();
        const dateIntTime = new Date(dateInt).getTime();
        const startDateTime = new Date(range.startDate).getTime();
        const endDateTime = new Date(range.endDate).getTime();
        // allow overwriting of subsequent date ranges
        if (dateIntTime >= startDateTime && startDateTime <= endDateTime) {
          mutliCoverageDates[dateIntFormatted] = { date: dateInt, interval: rangeInterval };
        }
      });

      return mutliCoverageDates;
    }, {});

    return Object.values(multiDateToDisplay);
  }

  /**
  * @desc updateDateRangeState
  * @param {Array} dateRange
  * @returns {Void}
  */
  updateDateRangeState = (dateRange) => {
    this.setState({
      dataDateRanges: dateRange,
    });
  }

  render() {
    const {
      axisWidth,
      position,
      transformX,
      dateRange,
      layer,
      layerPeriod,
      getMatchingCoverageLineDimensions,
      getRangeDateEndWithAddedInterval,
      createMatchingCoverageLineDOMEl,
      timeScale,
      hoveredLayer,
      getLayerItemStyles,
      isValidMultipleRangesLayer,
      isLayerGreaterZoomWithMultipleCoverage,
      isLayerEqualZoomWithMultipleCoverage,
    } = this.props;
    const {
      dataDateRanges,
    } = this.state;

    const {
      endDate,
      id,
      startDate,
      visible,
    } = layer;

    // condtional styling for line/background colors
    const {
      lineBackgroundColor,
    } = getLayerItemStyles(visible, id);

    // get line container dimensions
    const containerLineDimensions = getMatchingCoverageLineDimensions(layer);
    return (
      <>
        <div
          className="data-panel-coverage-line"
          style={{
            width: `${axisWidth}px`,
          }}
        >
          <svg
            className="data-panel-coverage-line-svg"
            width={axisWidth}
            viewBox={`0 0 ${axisWidth} 64`}
          >
            <defs>
              <clipPath id="dataLineBoundary">
                <rect x={0} y="0" width={axisWidth} height={12} />
              </clipPath>
              <pattern
                id="pattern"
                width="30"
                height="12"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(135 50 50)"
              >
                <rect fill="rgb(0, 69, 123)" width="30" height="12" />
                <line stroke="#164e7a" strokeWidth="30" y1="12" />
              </pattern>
              <pattern
                id="pattern2"
                width="30"
                height="12"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(135 50 50)"
              >
                <rect fill="rgb(116, 116, 116)" width="30" height="12" />
                <line stroke="#797979" strokeWidth="30" y1="12" />
              </pattern>
            </defs>
            {isValidMultipleRangesLayer && (isLayerGreaterZoomWithMultipleCoverage || isLayerEqualZoomWithMultipleCoverage)
              ? dataDateRanges.map((itemRange, multiIndex, array) => {
                const { date, interval } = itemRange;
                const nextDate = array[multiIndex + 1];
                const rangeDateEnd = getRangeDateEndWithAddedInterval(date, layerPeriod, interval, nextDate);
                // get range line dimensions
                const multiLineRangeOptions = getMatchingCoverageLineDimensions(layer, date, rangeDateEnd);
                // create DOM line element
                const key = `${id}-${multiIndex}`;
                return multiLineRangeOptions.visible
                  && (
                    <React.Fragment key={key}>
                      <DataLine
                        hoverOnToolTip={this.props.hoverOnToolTip}
                        hoverOffToolTip={this.props.hoverOffToolTip}
                        hoveredTooltip={this.props.hoveredTooltip}
                        axisWidth={axisWidth}
                        position={position}
                        transformX={transformX}
                        id={id}
                        options={multiLineRangeOptions}
                        lineType="MULTI"
                        startDate={date}
                        endDate={rangeDateEnd}
                        color={lineBackgroundColor}
                        layerPeriod={layerPeriod}
                        index={`${id}-${multiIndex}`}
                      />
                    </React.Fragment>
                  );
              })
              : containerLineDimensions.visible && (
                <DataLine
                  hoverOnToolTip={this.props.hoverOnToolTip}
                  hoverOffToolTip={this.props.hoverOffToolTip}
                  hoveredTooltip={this.props.hoveredTooltip}
                  axisWidth={axisWidth}
                  position={position}
                  transformX={transformX}
                  id={id}
                  options={containerLineDimensions}
                  lineType="CONTAINER"
                  startDate={new Date(startDate)}
                  endDate={endDate}
                  color={lineBackgroundColor}
                  layerPeriod={layerPeriod}
                  index={`${id}-0`}
                />
              )}
          </svg>
        </div>
      </>
    );
  }
}

DataItemContainer.propTypes = {
  axisWidth: PropTypes.number,
  position: PropTypes.number,
  transformX: PropTypes.number,
  dateRange: PropTypes.string,
  frontDate: PropTypes.string,
  backDate: PropTypes.string,
  layer: PropTypes.object,
  layerPeriod: PropTypes.string,
  getMatchingCoverageLineDimensions: PropTypes.func,
  getRangeDateEndWithAddedInterval: PropTypes.func,
  createMatchingCoverageLineDOMEl: PropTypes.func,
  timeScale: PropTypes.string,
  hoveredLayer: PropTypes.string,
  isValidMultipleRangesLayer: PropTypes.bool,
  isLayerGreaterZoomWithMultipleCoverage: PropTypes.bool,
  isLayerEqualZoomWithMultipleCoverage: PropTypes.bool,
  getMaxEndDate: PropTypes.func,
  getDatesInDateRange: PropTypes.func,
};

export default DataItemContainer;
