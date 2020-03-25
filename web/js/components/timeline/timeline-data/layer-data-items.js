/* eslint no-nested-ternary: 0 */
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
  getHeaderDOMEl = (layer, visible, dateRange, layerItemBackground) => {
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
  * @desc get formatted display dates for line tooltips and selectors
  * @param {String} lineType
  * @param {Object} startDate date
  * @param {Object} endDate date
  * @param {String} layerPeriod
  * @returns {Object}
  *   @param {String} dateRangeStart
  *   @param {String} dateRangeEnd
  *   @param {String} toolTipText
  */
  getFormattedDisplayDates = (lineType, startDate, endDate, layerPeriod) => {
    let dateRangeStart;
    let dateRangeEnd;
    let toolTipText;

    // eslint-disable-next-line default-case
    switch (lineType) {
      case 'CONTAINER':
        dateRangeStart = (startDate && startDate.split('T')[0]) || 'start';
        dateRangeEnd = (endDate && endDate.split('T')[0]) || 'present';
        toolTipText = `${dateRangeStart} to ${dateRangeEnd}`;
        break;
      case 'MULTI':
        dateRangeStart = startDate.toISOString().replace(/[.:]/g, '_');
        dateRangeEnd = endDate.toISOString().replace(/[.:]/g, '_');
        toolTipText = `${dateRangeStart.split('T')[0]} to ${dateRangeEnd.split('T')[0]}`;
        // handle minutes range display text (ex: '14:50 to 15:00')
        if (layerPeriod === 'minutes') {
          // eslint-disable-next-line prefer-destructuring
          dateRangeStart = startDate.toISOString().split('T')[1];
          // eslint-disable-next-line prefer-destructuring
          dateRangeEnd = endDate.toISOString().split('T')[1];
          toolTipText = `${dateRangeStart.split(':', 2).join(':')} to ${dateRangeEnd.split(':', 2).join(':')}`;
        }
        break;
      case 'SINGLE':
        dateRangeStart = startDate.replace(/:/g, '_');
        dateRangeEnd = endDate.replace(/:/g, '_');
        toolTipText = `${dateRangeStart.split('T')[0]} to ${dateRangeEnd.split('T')[0]}`;
        break;
    }

    return {
      dateRangeStart,
      dateRangeEnd,
      toolTipText,
    };
  }

  /**
  * @desc get line DOM element from full/partial (interval) date range with tooltip
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
  // createMatchingCoverageLineDOMEl = (id, options, dateRangeStart, dateRangeEnd, color, position, toolTipText, index) => {
  createMatchingCoverageLineDOMEl = (id, options, lineType, startDate, endDate, color, position, layerPeriod, index) => {
    const { hoverOnToolTip, hoverOffToolTip, hoveredTooltip } = this.props;
    const width = Math.max(options.width, 0);
    // get formatted dates based on line type
    const {
      dateRangeStart,
      dateRangeEnd,
      toolTipText,
    } = this.getFormattedDisplayDates(lineType, startDate, endDate, layerPeriod);
    const dateRangeStartEnd = `${id}-${dateRangeStart}-${dateRangeEnd}`;
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
  * @param {Object} endDateLimit data object
  * @param {Object} nextDate range object with date
  * @returns {Object} rangeDateEnd date object
  */
  getRangeDateEndWithAddedInterval = (rangeDate, layerPeriod, itemRangeInterval, endDateLimit, nextDate) => {
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

    let rangeDateEnd = new Date(rangeDateEndLocal.getTime() - (rangeDateEndLocal.getTimezoneOffset() * 60000));
    // check if next date cuts off this range
    // (e.g., 8 day interval with: currentDate = 12-27-1999, and nextDate = 1-1-2000)
    if (nextDate) {
      const nextDateObject = new Date(nextDate.date);
      const rangeDateEndTime = rangeDateEnd.getTime();
      const nextDateTime = nextDateObject.getTime();
      if (nextDateTime <= rangeDateEndTime) {
        rangeDateEnd = nextDateObject;
      }
    }
    if (endDateLimit < rangeDateEnd) {
      rangeDateEnd = endDateLimit;
    }
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

  /**
  * @desc get endDateLimit based on axis and appNow
  * @param {Boolean} layer inactive
  * @param {Boolean} isLastInRange
  * @returns {Object} endDateLimit date object
  */
  getMaxEndDate = (inactive, isLastInRange) => {
    const {
      appNow,
      backDate,
    } = this.props;

    let endDateLimit = new Date(backDate);
    const appNowDate = new Date(appNow);
    // appNow will override max range endDate
    if (appNowDate < endDateLimit) {
      endDateLimit = appNowDate;
    }
    // if last date of multiple ranges check for endDate over appNow date
    if (!inactive && isLastInRange) {
      if (endDateLimit > appNowDate) {
        endDateLimit = appNowDate;
      }
    }
    return endDateLimit;
  }

  /**
  * @desc get array of dates for layer
  * @param {Object} layer
  * @param {String} layerPeriod
  * @param {Object} range
  * @param {Object} endDateLimit
  * @param {Boolean} inactive
  * @param {Boolean} isLastInRange
  * @returns {Array} dateIntervalStartDates
  */
  getDatesInDateRange = (layer, layerPeriod, range, endDateLimit, inactive, isLastInRange) => {
    const {
      appNow,
      frontDate,
    } = this.props;

    const {
      dateInterval,
      startDate,
      endDate,
    } = range;

    const rangeInterval = Number(range.dateInterval);
    const rangeStart = range.startDate;
    let rangeEnd = range.endDate;

    let startDateLimit = new Date(frontDate);
    // get leading start date minus rangeInterval and add to end date
    startDateLimit = moment.utc(startDateLimit).subtract(rangeInterval, layerPeriod);
    startDateLimit = moment(startDateLimit).toDate();
    rangeEnd = moment.utc(rangeEnd).add(rangeInterval, layerPeriod);
    rangeEnd = moment(rangeEnd).toDate();

    // rangeEnd for last time coverage section of active layers can't be greater than appNow
    const appNowDate = new Date(appNow);
    if (!inactive && isLastInRange) {
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

    return dateIntervalStartDates;
  }


  render() {
    const {
      activeLayers,
      axisWidth,
      getMatchingCoverageLineDimensions,
      hoveredLayer,
      timeScale,
    } = this.props;

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
          let layerPeriod = period === 'daily'
            ? 'day'
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

          // get line container dimensions
          const containerLineDimensions = getMatchingCoverageLineDimensions(layer);
          // condtional styling for line/background colors
          const containerBackgroundColor = visible
            ? 'rgb(204, 204, 204)'
            : 'rgb(79, 79, 79)';
          // lighten data panel layer container on sidebar hover
          const containerHoveredBackgroundColor = visible
            ? 'rgb(230, 230, 230)'
            : 'rgb(101, 101, 101)';
          const backgroundColor = visible
            ? 'rgb(0, 69, 123)'
            : 'rgb(116, 116, 116)';
          const isLayerHoveredInSidebar = id === hoveredLayer;

          // get date range
          const dateRange = this.getFormattedDateRange(layer);
          const dateRangeIntervalZeroIndex = dateRanges
            ? Number(dateRanges[0].dateInterval)
            : 1;

          const multipleCoverageRangesDateIntervals = {};
          const layerItemBackground = isLayerHoveredInSidebar
            ? containerHoveredBackgroundColor
            : containerBackgroundColor;
          const key = index;
          return (
            <div
              key={key}
              className={`data-panel-layer-item data-item-${id}`}
              style={{
                background: layerItemBackground,
                outline: isLayerHoveredInSidebar ? '1px solid rgb(204, 204, 204)' : '',
              }}
            >
              {/* Layer Header DOM El */
                this.getHeaderDOMEl(layer, visible, dateRange, layerItemBackground)
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
                        const isLastInRange = innerIndex === dateRanges.length - 1;
                        const rangeInterval = Number(range.dateInterval);
                        // multi time unit range - no year time unit
                        if (isLayerGreaterIncrementThanZoom || (rangeInterval !== 1 && timeScale !== 'year')) {
                          const endDateLimit = this.getMaxEndDate(inactive, isLastInRange);
                          // get dates based on date ranges
                          const dateIntervalStartDates = this.getDatesInDateRange(layer, layerPeriod, range, endDateLimit, inactive, isLastInRange);
                          // add date intervals to multipleCoverageRangesDateIntervals object to catch repeats
                          dateIntervalStartDates.forEach((dateInt) => {
                            const dateIntFormatted = dateInt.toISOString();
                            multipleCoverageRangesDateIntervals[dateIntFormatted] = { date: dateInt, interval: rangeInterval };
                          });

                          // if at the end of dateRanges array, display results from multipleCoverageRangesDateIntervals
                          if (isLastInRange) {
                            const multiDateToDisplay = Object.values(multipleCoverageRangesDateIntervals);
                            return multiDateToDisplay.map((itemRange, multiIndex) => {
                              const rangeDate = itemRange.date;
                              const itemRangeInterval = itemRange.interval;
                              const nextDate = multiDateToDisplay[multiIndex + 1];
                              const rangeDateEnd = this.getRangeDateEndWithAddedInterval(rangeDate, layerPeriod, itemRangeInterval, endDateLimit, nextDate);
                              // get range line dimensions
                              const multiLineRangeOptions = getMatchingCoverageLineDimensions(layer, rangeDate, rangeDateEnd);
                              // create DOM line element
                              return multiLineRangeOptions.visible
                                && this.createMatchingCoverageLineDOMEl(
                                  id,
                                  multiLineRangeOptions,
                                  'MULTI',
                                  rangeDate,
                                  rangeDateEnd,
                                  backgroundColor,
                                  'absolute',
                                  layerPeriod,
                                  `${id}-${multiIndex}`,
                                );
                            });
                          }
                          return null;
                        }
                        // handle single coverage
                        const rangeStart = range.startDate;
                        let rangeEnd = range.endDate;
                        if (range.startDate === range.endDate) {
                          rangeEnd = moment.utc(range.startDate).add(rangeInterval + 1, layerPeriod).format();
                        } else {
                          rangeEnd = moment.utc(rangeEnd).endOf(layerPeriod).format();
                        }

                        // get range line dimensions
                        const singleLineOptions = getMatchingCoverageLineDimensions(layer, rangeStart, rangeEnd);
                        // create DOM line element
                        return singleLineOptions.visible
                          && this.createMatchingCoverageLineDOMEl(
                            id,
                            singleLineOptions,
                            'SINGLE',
                            rangeStart,
                            rangeEnd,
                            backgroundColor,
                            'absolute',
                            layerPeriod,
                            `${id}-${innerIndex}`,
                          );
                      })}
                    </div>
                  )
                  // single start -> end date range coverage
                  : containerLineDimensions.visible
                  && this.createMatchingCoverageLineDOMEl(
                    id,
                    containerLineDimensions,
                    'CONTAINER',
                    startDate,
                    endDate,
                    backgroundColor,
                    'relative',
                    layerPeriod,
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
