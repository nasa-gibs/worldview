import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Tooltip } from 'reactstrap';
import { datesinDateRanges } from '../../../modules/layers/util';
import util from '../../../util/util';

import {
  timeScaleToNumberKey,
} from '../../../modules/date/constants';

// ignore multiple date ranges due to WV config not building to
// handle varying periods in same layer (example: M and D)
const ignoredLayer = {
  GRACE_Tellus_Liquid_Water_Equivalent_Thickness_Mascon_CRI: true,
};

/*
 * Layer Data Container for layer coverage.
 *
 * @class LayerDataItems
 */

class LayerDataItems extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  /**
  * @desc get layer header with title, subtitle, and full date range
  * @param {Object} layer
  * @param {Boolean} visible
  * @param {String} dateRange
  * @param {String} background color
  * @returns {DOM Element} header
  */
  getHeader = (layer, visible, dateRange, layerItemBackground) => {
    const titleColor = visible ? '#000' : '#999';
    const textColor = visible ? '#222' : '#999';
    return (
      <>
        <div className="data-panel-layer-item-header">
          <div
            className="data-panel-layer-item-title"
            style={{
              color: titleColor,
              fontSize: '1em',
            }}
          >
            {layer.title}
            {' '}
            <span
              className="data-panel-layer-item-subtitle"
              style={{
                color: textColor,
                fontSize: '0.9em',
              }}
            >
              {layer.subtitle}
            </span>
          </div>
          <div
            className="data-panel-layer-item-date-range"
            style={{
              background: layerItemBackground,
              color: textColor,
              fontSize: '0.9em',
            }}
          >
            {dateRange}
          </div>
        </div>
      </>
    );
  }

  /**
  * @desc get line DOM element from full/partial (interval) date range
  * @param {String} id
  * @param {Object} options
  * @param {String} dateRangeStart
  * @param {String} dateRangeEnd
  * @param {String} color
  * @param {String} position
  * @param {String} toolTipText
  * @param {Number/String} index
  * @returns {DOM Element} line
  */
  createMatchingCoverageLineDOMEl = (id, options, dateRangeStart, dateRangeEnd, color, position, toolTipText, index) => {
    const { hoverOnToolTip, hoverOffToolTip, hoveredTooltip } = this.props;
    const dateRangeStartEnd = `${id}-${dateRangeStart}-${dateRangeEnd}`;
    const width = Math.max(options.width, 0);

    return (
      <div
        id={`data-coverage-line-${dateRangeStartEnd}`}
        className="data-panel-coverage-line"
        key={index}
        onMouseEnter={() => hoverOnToolTip(`${dateRangeStartEnd}`)}
        onMouseLeave={() => hoverOffToolTip()}
        style={{
          position,
          left: options.leftOffset,
          width: `${width}px`,
          backgroundColor: color,
          borderRadius: options.borderRadius,
        }}
      >
        <Tooltip
          placement={options.toolTipPlacement}
          container={`.data-item-${id}`}
          isOpen={hoveredTooltip[`${dateRangeStartEnd}`]}
          target={`data-coverage-line-${dateRangeStartEnd}`}
        >
          {toolTipText}
        </Tooltip>
      </div>
    );
  }

  /**
  * @desc get range date end with added interval based on period
  * @param {Object} range date object
  * @param {String} time unit period
  * @param {Number} itemRangeInterval
  * @returns {Object} rangeDateEnd date object
  */
  getRangeDateEndWithAddedInterval = (rangeDate, layerPeriod, itemRangeInterval) => {
    const minYear = rangeDate.getUTCFullYear();
    const minMonth = rangeDate.getUTCMonth();
    const minDay = rangeDate.getUTCDate();
    const minHour = rangeDate.getUTCHours();
    const minMinute = rangeDate.getUTCMinutes();
    const yearAdd = layerPeriod === 'years' ? itemRangeInterval : 0;
    const monthAdd = layerPeriod === 'months' ? itemRangeInterval : 0;
    const dayAdd = layerPeriod === 'days' ? itemRangeInterval : 0;
    const hourAdd = layerPeriod === 'hours' ? itemRangeInterval : 0;
    const minuteAdd = layerPeriod === 'minutes' ? itemRangeInterval : 0;
    const rangeDateEndLocal = new Date(
      minYear + yearAdd,
      minMonth + monthAdd,
      minDay + dayAdd,
      minHour + hourAdd,
      minMinute + minuteAdd,
    );

    const rangeDateEnd = new Date(rangeDateEndLocal.getTime() - (rangeDateEndLocal.getTimezoneOffset() * 60000));
    return rangeDateEnd;
  }

  /**
  * @desc get formatted, readable date range for header
  * @param {Object} layer
  * @returns {String} dateRangeText
  */
  getFormattedDateRange = (layer) => {
    // get start date -or- 'start'
    let dateRangeStart;
    if (layer.startDate) {
      const yearMonthDaySplit = layer.startDate.split('T')[0].split('-');
      const year = yearMonthDaySplit[0];
      const month = yearMonthDaySplit[1];
      const day = yearMonthDaySplit[2];

      const monthAbbrev = util.monthStringArray[Number(month) - 1];

      dateRangeStart = `${year} ${monthAbbrev} ${day}`;
    } else {
      dateRangeStart = 'Start';
    }

    // get end date -or- 'present'
    let dateRangeEnd;
    if (layer.endDate) {
      const yearMonthDaySplit = layer.endDate.split('T')[0].split('-');
      const year = yearMonthDaySplit[0];
      const month = yearMonthDaySplit[1];
      const day = yearMonthDaySplit[2];

      const monthAbbrev = util.monthStringArray[Number(month) - 1];

      dateRangeEnd = `${year} ${monthAbbrev} ${day}`;
    } else {
      dateRangeEnd = 'Present';
    }

    const dateRangeText = `${dateRangeStart} to ${dateRangeEnd}`;
    return dateRangeText;
  }

  render() {
    const {
      activeLayers,
      appNow,
      axisWidth,
      backDate,
      frontDate,
      getMatchingCoverageLineDimensions,
      hoveredLayer,
      timeScale,
    } = this.props;

    const baseLineColor = '#00457B';
    return (
      <div className="data-panel-layer-list">
        {activeLayers.map((layer, index) => {
          const {
            dateRanges,
            endDate,
            id,
            inactive,
            period,
            startDate,
            visible,
          } = layer;
          if (!dateRanges) {
            return null;
          }
          // check for multiple date ranges
          let multipleCoverageRanges = false;
          if (dateRanges && !ignoredLayer[id]) {
            multipleCoverageRanges = dateRanges.length > 1;
          }
          // eslint-disable-next-line no-nested-ternary
          let layerPeriod = period === 'daily'
            ? 'day'
            // eslint-disable-next-line no-nested-ternary
            : period === 'monthly'
              ? 'month'
              : period === 'yearly'
                ? 'year'
                : 'minute';

          // get layer scale number to determine relation to current axis zoom level
          const timeScaleNumber = timeScaleToNumberKey[timeScale];
          const layerScaleNumber = timeScaleToNumberKey[layerPeriod];
          const isLayerGreaterIncrementThanZoom = layerScaleNumber < timeScaleNumber;
          const isLayerEqualIncrementThanZoom = layerScaleNumber === timeScaleNumber;

          // concat (ex: day to days) for moment manipulation below
          layerPeriod += 's';

          // get line dimensions and handle condtional styling
          const containerLineDimensions = getMatchingCoverageLineDimensions(layer);
          const containerBackgroundColor = visible ? '#ccc' : 'rgb(79, 79, 79)';
          // lighten data panel layer container on sidebar hover
          const containerHoveredBackgroundColor = visible ? '#e6e6e6' : 'rgb(101, 101, 101)';
          const backgroundColor = visible ? baseLineColor : 'rgb(116, 116, 116)';
          const isLayerHoveredInSidebar = id === hoveredLayer;

          // get date range to display
          const dateRangeStart = (startDate && startDate.split('T')[0]) || 'start';
          const dateRangeEnd = (endDate && endDate.split('T')[0]) || 'present';
          const dateRange = this.getFormattedDateRange(layer);
          const dateRangeIntervalZeroIndex = dateRanges
            ? Number(dateRanges[0].dateInterval)
            : 1;

          const multipleCoverageRangesDateIntervals = {};
          const layerItemBackground = isLayerHoveredInSidebar ? containerHoveredBackgroundColor : containerBackgroundColor;
          const key = index;
          return (
            <div
              key={key}
              className={`data-panel-layer-item data-item-${id}`}
              style={{
                background: layerItemBackground,
                outline: isLayerHoveredInSidebar ? '1px solid #222' : '',
              }}
            >
              {/* Layer Header */
                this.getHeader(layer, visible, dateRange, layerItemBackground)
              }
              <div
                className={`data-panel-layer-coverage-line-container data-line-${id}`}
                style={{
                  maxWidth: `${axisWidth}px`,
                }}
              >
                {(isLayerGreaterIncrementThanZoom && (multipleCoverageRanges || dateRangeIntervalZeroIndex))
                || (isLayerEqualIncrementThanZoom && dateRangeIntervalZeroIndex && dateRangeIntervalZeroIndex !== 1)
                // multiple coverage ranges
                  ? (
                    <div
                      className="data-panel-coverage-line"
                      style={{
                        width: `${containerLineDimensions.width}px`,
                      }}
                    >
                      {dateRanges.map((range, innerIndex) => {
                        const rangeInterval = Number(range.dateInterval);
                        const rangeStart = range.startDate;
                        let rangeEnd = range.endDate;
                        // multi time unit range - no year time unit
                        if (isLayerGreaterIncrementThanZoom || (rangeInterval !== 1 && timeScale !== 'year')) {
                          let startDateLimit = new Date(frontDate);
                          // get leading start date minus rangeInterval and add to end date
                          startDateLimit = moment.utc(startDateLimit).subtract(rangeInterval, layerPeriod);
                          startDateLimit = moment(startDateLimit).toDate();
                          rangeEnd = moment.utc(rangeEnd).add(rangeInterval, layerPeriod);
                          rangeEnd = moment(rangeEnd).toDate();
                          // get max end date based on dates visible on axis and appNow date
                          let endDateLimit = new Date(backDate);
                          const appNowDate = new Date(appNow);
                          if (appNowDate < endDateLimit) {
                            endDateLimit = appNowDate;
                          }
                          // if last date of multiple ranges check for endDate over appNow date
                          if (!inactive && innerIndex === dateRanges.length - 1) {
                            if (endDateLimit > appNowDate) {
                              endDateLimit = appNowDate;
                            }
                            rangeEnd = appNowDate;
                          }

                          // get dates within given date range
                          let dateIntervalStartDates = [];
                          const startLessThanOrEqualToEndDateLimit = new Date(rangeStart).getTime() <= endDateLimit.getTime();
                          const endGreaterThanOrEqualToStartDateLimit = new Date(rangeEnd).getTime() >= startDateLimit.getTime();
                          if (startLessThanOrEqualToEndDateLimit && endGreaterThanOrEqualToStartDateLimit) {
                            const inputStartDate = new Date(startDateLimit);
                            const inputEndDate = new Date(endDateLimit);
                            dateIntervalStartDates = datesinDateRanges(layer, inputStartDate, inputStartDate, inputEndDate);
                          }
                          // add date intervals to multipleCoverageRangesDateIntervals object to catch repeats
                          dateIntervalStartDates.forEach((dateInt) => {
                            const dateIntFormatted = dateInt.toISOString();
                            multipleCoverageRangesDateIntervals[dateIntFormatted] = { date: dateInt, interval: rangeInterval };
                          });

                          // if at the end of dateRanges array, display results from multipleCoverageRangesDateIntervals
                          if (innerIndex === dateRanges.length - 1) {
                            const multiDateToDisplay = Object.values(multipleCoverageRangesDateIntervals);
                            return multiDateToDisplay.map((itemRange, multiIndex) => {
                              const rangeDate = itemRange.date;
                              const itemRangeInterval = itemRange.interval;
                              let rangeDateEnd = this.getRangeDateEndWithAddedInterval(rangeDate, layerPeriod, itemRangeInterval);
                              // check if next date cuts off this range
                              // (e.g., 8 day interval with: currentDate = 12-27-1999, and nextDate = 1-1-2000)
                              if (multiDateToDisplay[multiIndex + 1]) {
                                const nextDateObject = multiDateToDisplay[multiIndex + 1];
                                const rangeDateEndTime = rangeDateEnd.getTime();
                                const nextDate = nextDateObject.date;
                                const nextDateTime = nextDate.getTime();
                                if (nextDateTime <= rangeDateEndTime) {
                                  rangeDateEnd = nextDate;
                                }
                              }
                              if (endDateLimit < rangeDateEnd) {
                                rangeDateEnd = endDateLimit;
                              }

                              // get range line dimensions
                              const multiLineRangeOptions = getMatchingCoverageLineDimensions(layer, rangeDate, rangeDateEnd);

                              // get formatted dates for tooltip display
                              const cleanRangeStart = rangeDate.toISOString().replace(/[.:]/g, '_');
                              const cleanRangeEnd = rangeDateEnd.toISOString().replace(/[.:]/g, '_');
                              let displayText = `${cleanRangeStart.split('T')[0]} to ${cleanRangeEnd.split('T')[0]}`;

                              // handle minutes range display text (ex: '14:50 to 15:00')
                              if (layerPeriod === 'minutes') {
                                const minutesRangeDateStart = rangeDate.toISOString().split('T')[1];
                                const minutesRangeDateEnd = rangeDateEnd.toISOString().split('T')[1];
                                displayText = `${minutesRangeDateStart.split(':', 2).join(':')} to ${minutesRangeDateEnd.split(':', 2).join(':')}`;
                              }
                              return multiLineRangeOptions.visible
                                && this.createMatchingCoverageLineDOMEl(
                                  id,
                                  multiLineRangeOptions,
                                  cleanRangeStart,
                                  cleanRangeEnd,
                                  backgroundColor,
                                  'absolute',
                                  displayText,
                                  multiIndex,
                                );
                            });
                          }
                          return null;
                        }
                        // handle single coverage
                        if (range.startDate === range.endDate) {
                          rangeEnd = moment.utc(range.startDate).add(rangeInterval + 1, layerPeriod).format();
                        } else {
                          rangeEnd = moment.utc(rangeEnd).endOf(layerPeriod).format();
                        }

                        // get range line dimensions
                        const singleLineOptions = getMatchingCoverageLineDimensions(layer, rangeStart, rangeEnd);

                        // get formatted dates for tooltip display
                        const cleanRangeStart = rangeStart.replace(/:/g, '_');
                        const cleanRangeEnd = rangeEnd.replace(/:/g, '_');
                        return singleLineOptions.visible
                          && this.createMatchingCoverageLineDOMEl(
                            id,
                            singleLineOptions,
                            cleanRangeStart,
                            cleanRangeEnd,
                            backgroundColor,
                            'absolute',
                            `${cleanRangeStart.split('T')[0]} to ${cleanRangeEnd.split('T')[0]}`,
                            index,
                          );
                      })}
                    </div>
                  )
                  // single start -> end date range coverage
                  : containerLineDimensions.visible
                  && this.createMatchingCoverageLineDOMEl(
                    id,
                    containerLineDimensions,
                    dateRangeStart,
                    dateRangeEnd,
                    backgroundColor,
                    'relative',
                    `${dateRangeStart} to ${dateRangeEnd}`,
                    `${id}-0`,
                  )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
}

LayerDataItems.propTypes = {
  activeLayers: PropTypes.array,
  appNow: PropTypes.object,
  axisWidth: PropTypes.number,
  backDate: PropTypes.string,
  frontDate: PropTypes.string,
  getMatchingCoverageLineDimensions: PropTypes.func,
  hoveredLayer: PropTypes.string,
  hoveredTooltip: PropTypes.object,
  hoverOffToolTip: PropTypes.func,
  hoverOnToolTip: PropTypes.func,
  timeScale: PropTypes.string,
};

export default LayerDataItems;
