import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import CoverageLine from './coverage-line';

/*
 * Coverage Item Container for individual layer temporal coverage.
 *
 * @function CoverageItemContainer
 */

const CoverageItemContainer = ({
  axisWidth,
  backDate,
  frontDate,
  getDatesInDateRange,
  getLayerItemStyles,
  getMatchingCoverageLineDimensions,
  getMaxEndDate,
  getRangeDateEndWithAddedInterval,
  layer,
  layerPeriod,
  needDateRangeBuilt,
  positionTransformX,
}) => {
  const [layerDateRanges, setlayerDateRanges] = useState([]);

  /**
  * @desc getDateRangeToDisplay
  * @param {Array} dateRanges
  * @returns {Promise<Array>} multiDateToDisplay
  */
  const getDateRangeToDisplay = async (dateRanges) => {
    const multiDateToDisplay = await dateRanges.reduce(async (dates, range, innerIndex) => {
      const multiCoverageDates = { ...dates };
      const { dateInterval, startDate, endDate } = range;
      const isLastInRange = innerIndex === dateRanges.length - 1;
      const rangeInterval = Number(dateInterval);
      // get max end date based on axis, appNow, and futureTime (if applicable)
      const endDateLimit = getMaxEndDate(layer, isLastInRange);
      // get dates based on date ranges
      const startDateTime = new Date(startDate).getTime();
      const endDateTime = new Date(endDate).getTime();
      const dateIntervalStartDates = await getDatesInDateRange(
        layer, range, endDateLimit, isLastInRange);

      // add date intervals to multiCoverageDates object to catch repeats
      dateIntervalStartDates.forEach((dateIntStartDate) => {
        const dateIntTime = new Date(dateIntStartDate).getTime();
        // allow overwriting of subsequent date ranges
        if (dateIntTime >= startDateTime && dateIntTime <= endDateTime) {
          const dateIntFormatted = dateIntStartDate.toISOString();
          multiCoverageDates[dateIntFormatted] = {
            date: dateIntFormatted,
            interval: rangeInterval,
          };
        }
      });
      return multiCoverageDates;
    }, {});

    return Object.values(multiDateToDisplay);
  };

  useEffect(() => {
    if (!needDateRangeBuilt) return;

    let cancelled = false;

    getDateRangeToDisplay(layer.dateRanges).then((dateRangesToDisplay) => {
      if (!cancelled) setlayerDateRanges(dateRangesToDisplay);
    });

    return () => {
      cancelled = true;
    };
  }, [frontDate, backDate]);

  // layer options
  const {
    endDate,
    id,
    startDate,
    visible,
  } = layer;

  // conditional styling for line/background colors
  const {
    lineBackgroundColor,
  } = getLayerItemStyles(visible, id);

  // get line container dimensions
  const containerLineDimensions = getMatchingCoverageLineDimensions(layer)
    .filter(({ visible: isVisible }) => isVisible);
  return (
    <div
      className="layer-coverage-line"
      style={{
        width: `${axisWidth}px`,
      }}
    >
      <svg
        className="layer-coverage-line-svg"
        width={`${axisWidth}px`}
      >
        {needDateRangeBuilt
          ? layerDateRanges.map((itemRange, multiIndex, array) => {
            const { date, interval } = itemRange;
            const dateObj = new Date(date);
            const nextDate = array[multiIndex + 1];
            const rangeDateEnd = getRangeDateEndWithAddedInterval(
              layer,
              dateObj,
              layerPeriod,
              interval,
              nextDate,
            );
            // get range line dimensions
            const multiLineRangeOptions = getMatchingCoverageLineDimensions(
              layer,
              dateObj,
              rangeDateEnd,
            ).filter(({ visible: isVisible }) => isVisible);
            // create DOM line element
            const key = `${id}-${multiIndex}`;
            return (
              <React.Fragment key={key}>
                <CoverageLine
                  axisWidth={axisWidth}
                  positionTransformX={positionTransformX}
                  id={id}
                  options={multiLineRangeOptions}
                  lineType="MULTI"
                  startDate={date}
                  endDate={rangeDateEnd}
                  color={lineBackgroundColor}
                  layerPeriod={layerPeriod}
                  index={key}
                />
              </React.Fragment>
            );
          })
          : (
            <CoverageLine
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
  );
};

CoverageItemContainer.propTypes = {
  axisWidth: PropTypes.number,
  backDate: PropTypes.string,
  frontDate: PropTypes.string,
  getDatesInDateRange: PropTypes.func,
  getLayerItemStyles: PropTypes.func,
  getMatchingCoverageLineDimensions: PropTypes.func,
  getMaxEndDate: PropTypes.func,
  getRangeDateEndWithAddedInterval: PropTypes.func,
  needDateRangeBuilt: PropTypes.bool,
  layer: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  layerPeriod: PropTypes.string,
  positionTransformX: PropTypes.number,
};

export default CoverageItemContainer;
