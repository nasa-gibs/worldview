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
    const {
      layer,
      needDateRangeBuilt,
    } = this.props;
    const { dateRanges } = layer;
    // handle date range query/array building
    if (needDateRangeBuilt) {
      const dateRangesToDisplay = this.getDateRangeToDisplay(dateRanges);
      this.updateDateRangeState(dateRangesToDisplay);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const {
      layer,
      frontDate,
      backDate,
      needDateRangeBuilt,
    } = this.props;
    const { dateRanges } = layer;

    const frontDateChanged = prevProps.frontDate !== frontDate;
    const backDateChanged = prevProps.backDate !== backDate;

    if (frontDateChanged || backDateChanged) {
      if (needDateRangeBuilt) {
        const dateRangesToDisplay = this.getDateRangeToDisplay(dateRanges);
        this.updateDateRangeState(dateRangesToDisplay);
      }
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
      const { dateInterval, startDate, endDate } = range;
      const isLastInRange = innerIndex === dateRanges.length - 1;
      const rangeInterval = Number(dateInterval);
      // multi time unit range - no year time unit
      const endDateLimit = getMaxEndDate(inactive, isLastInRange);
      // get dates based on date ranges
      const dateIntervalStartDates = getDatesInDateRange(layer, range, endDateLimit, isLastInRange);
      const startDateTime = new Date(startDate).getTime();
      const endDateTime = new Date(endDate).getTime();
      // add date intervals to mutliCoverageDates object to catch repeats
      dateIntervalStartDates.forEach((dateIntStartDate) => {
        const dateIntTime = new Date(dateIntStartDate).getTime();
        // allow overwriting of subsequent date ranges
        if (dateIntTime >= startDateTime && dateIntTime < endDateTime) {
          const dateIntFormatted = dateIntStartDate.toISOString();
          mutliCoverageDates[dateIntFormatted] = {
            date: dateIntFormatted,
            interval: rangeInterval,
          };
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
      getLayerItemStyles,
      getMatchingCoverageLineDimensions,
      getRangeDateEndWithAddedInterval,
      layer,
      layerPeriod,
      positionTransformX,
      needDateRangeBuilt,
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
            width={`${axisWidth}px`}
          >
            {needDateRangeBuilt
              ? dataDateRanges.map((itemRange, multiIndex, array) => {
                const { date, interval } = itemRange;
                const dateObj = new Date(date);
                const nextDate = array[multiIndex + 1];
                const rangeDateEnd = getRangeDateEndWithAddedInterval(dateObj, layerPeriod, interval, nextDate);
                // get range line dimensions
                const multiLineRangeOptions = getMatchingCoverageLineDimensions(layer, dateObj, rangeDateEnd);
                // create DOM line element
                const key = `${id}-${multiIndex}`;
                return multiLineRangeOptions.visible
                  && (
                    <React.Fragment key={key}>
                      <DataLine
                        axisWidth={axisWidth}
                        positionTransformX={positionTransformX}
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
                  axisWidth={axisWidth}
                  positionTransformX={positionTransformX}
                  id={id}
                  options={containerLineDimensions}
                  lineType="SINGLE"
                  startDate={startDate}
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
  backDate: PropTypes.string,
  frontDate: PropTypes.string,
  getDatesInDateRange: PropTypes.func,
  getLayerItemStyles: PropTypes.func,
  getMatchingCoverageLineDimensions: PropTypes.func,
  getMaxEndDate: PropTypes.func,
  getRangeDateEndWithAddedInterval: PropTypes.func,
  needDateRangeBuilt: PropTypes.bool,
  layer: PropTypes.object,
  layerPeriod: PropTypes.string,
  positionTransformX: PropTypes.number,
};

export default DataItemContainer;
