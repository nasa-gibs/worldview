/* eslint no-nested-ternary: 0 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Tooltip } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
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
            }}
          >
            {layer.title}
            {' '}
            <span
              className="data-panel-layer-item-subtitle"
              style={{
                color: textColor,
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
        // handle minutes range display text (ex: '14:50 to 15:00')
        if (layerPeriod === 'minutes') {
          // eslint-disable-next-line prefer-destructuring
          dateRangeStart = startDate.toISOString().split('T')[1];
          // eslint-disable-next-line prefer-destructuring
          dateRangeEnd = endDate.toISOString().split('T')[1];
          toolTipText = `${dateRangeStart.split(':', 2).join(':')} to ${dateRangeEnd.split(':', 2).join(':')}`;
          dateRangeStart = dateRangeStart.replace(/[.:]/g, '_');
          dateRangeEnd = dateRangeEnd.replace(/[.:]/g, '_');
        } else {
          dateRangeStart = startDate.toISOString().replace(/[.:]/g, '_');
          dateRangeEnd = endDate.toISOString().replace(/[.:]/g, '_');
          toolTipText = `${dateRangeStart.split('T')[0]} to ${dateRangeEnd.split('T')[0]}`;
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
  * @param {String} toolTipText
  * @param {Number/String} index
  * @returns {DOM Element} line
  */
  createMatchingCoverageLineDOMEl = (id, options, lineType, startDate, endDate, color, layerPeriod, index) => {
    const {
      axisWidth,
      hoverOnToolTip,
      hoverOffToolTip,
      hoveredTooltip,
      position,
      transformX,
    } = this.props;
    const {
      borderRadius,
      leftOffset,
      isWidthGreaterThanRendered,
      width,
    } = options;
    const lineWidth = Math.max(width, 0);

    // get formatted dates based on line type
    const {
      dateRangeStart,
      dateRangeEnd,
      toolTipText,
    } = this.getFormattedDisplayDates(lineType, startDate, endDate, layerPeriod);
    const dateRangeStartEnd = `${id}-${dateRangeStart}-${dateRangeEnd}`;

    // handle tooltip positioning
    const toolTipOffset = -leftOffset - (lineWidth < axisWidth ? leftOffset : axisWidth / 2);
    const toolTipPlacement = 'auto';

    // candy stripe color
    const altLineColor = color === 'rgb(0, 69, 123)'
      ? '#164e7a'
      : '#797979';
    const stripeBackground = `repeating-linear-gradient(45deg,
      ${color},
      ${color} 20px,
      ${altLineColor} 20px,
      ${altLineColor} 40px)`;
    const backgroundPositionCalculated = `${leftOffset + lineWidth + position + transformX}px 0`;
    const backgroundPosition = !isWidthGreaterThanRendered
      || (leftOffset !== 0 && isWidthGreaterThanRendered)
      ? 0
      : backgroundPositionCalculated;

    return (
      <div
        key={index}
        className="data-panel-coverage-line-container"
      >
        <div
          id={`data-coverage-line-${dateRangeStartEnd}`}
          className="data-panel-coverage-line"
          onMouseEnter={() => hoverOnToolTip(`${dateRangeStartEnd}`)}
          onMouseLeave={() => hoverOffToolTip()}
          style={{
            transform: `translate(${leftOffset}px, 0)`,
            width: `${lineWidth}px`,
            borderRadius,
            background: stripeBackground,
            backgroundPosition,
          }}
        >
          <Tooltip
            placement={toolTipPlacement}
            boundariesElement={`data-coverage-line-${dateRangeStartEnd}`}
            offset={toolTipOffset}
            container={`.data-item-${id}`}
            isOpen={hoveredTooltip[`${dateRangeStartEnd}`]}
            target={`data-coverage-line-${dateRangeStartEnd}`}
          >
            {toolTipText}
          </Tooltip>
        </div>
      </div>
    );
  }

  /**
  * @desc get range date end with added interval based on period
  * @param {Object} range date object
  * @param {String} time unit period
  * @param {Number} itemRangeInterval
  * @param {Object} nextDate range object with date
  * @returns {Object} rangeDateEnd date object
  */
  getRangeDateEndWithAddedInterval = (rangeDate, layerPeriod, itemRangeInterval, nextDate) => {
    const { appNow } = this.props;
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
    // prevent range end exceeding appNow
    if (appNow < rangeDateEnd) {
      rangeDateEnd = appNow;
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

  /**
  * @desc get conditional styling for layer container and coverage line
  * @param {Boolean} visible
  * @param {String} id
  * @returns {Object}
  *   @param {String} lineBackgroundColor
  *   @param {String} layerItemBackground
  *   @param {String} layerItemOutline
  */
  getLayerItemStyles = (visible, id) => {
    const { hoveredLayer } = this.props;
    // conditional styling for line/background colors
    const containerBackgroundColor = visible
      ? 'rgb(204, 204, 204)'
      : 'rgb(79, 79, 79)';
    // lighten data panel layer container on sidebar hover
    const containerHoveredBackgroundColor = visible
      ? 'rgb(230, 230, 230)'
      : 'rgb(101, 101, 101)';
    // layer coverage line color
    const lineBackgroundColor = visible
      ? 'rgb(0, 69, 123)'
      : 'rgb(116, 116, 116)';
    // check if provided id is hovered over for background color and outline
    const isLayerHoveredInSidebar = id === hoveredLayer;
    const layerItemBackground = isLayerHoveredInSidebar
      ? containerHoveredBackgroundColor
      : containerBackgroundColor;
    const layerItemOutline = isLayerHoveredInSidebar
      ? '1px solid rgb(204, 204, 204)'
      : '';

    return {
      lineBackgroundColor,
      layerItemBackground,
      layerItemOutline,
    };
  }

  render() {
    const {
      activeLayers,
      axisWidth,
      getMatchingCoverageLineDimensions,
      timeScale,
    } = this.props;
    const emptyLayers = activeLayers.length === 0;
    return (
      <div className="data-panel-layer-list">
        {emptyLayers
          && (
          <div className="data-panel-layer-empty">
            <div className="data-item-empty">
              <FontAwesomeIcon icon={faExclamationTriangle} className="error-icon" />
              <p>No visible layers with defined coverage. Add layers or toggle &quot;Include Hidden Layers&quot; if current layers are hidden.</p>
            </div>
          </div>
          )}
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
          if (!dateRanges && !startDate) {
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
          // conditional styling for line/background colors
          const {
            lineBackgroundColor,
            layerItemBackground,
            layerItemOutline,
          } = this.getLayerItemStyles(visible, id);

          // get date range
          const dateRange = this.getFormattedDateRange(layer);
          const dateRangeIntervalZeroIndex = dateRanges
            ? Number(dateRanges[0].dateInterval)
            : 1;

          const multipleCoverageRangesDateIntervals = {};
          const isValidMultipleRangesLayer = !ignoredLayer[id] && dateRanges;
          const isLayerGreaterZoomWithMultipleCoverage = isLayerGreaterIncrementThanZoom && (multipleCoverageRanges || dateRangeIntervalZeroIndex);
          const isLayerEqualZoomWithMultipleCoverage = isLayerEqualIncrementThanZoom && dateRangeIntervalZeroIndex && dateRangeIntervalZeroIndex !== 1;
          const key = index;
          return (
            <div
              key={key}
              className={`data-panel-layer-item data-item-${id}`}
              style={{
                background: layerItemBackground,
                outline: layerItemOutline,
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
                {isValidMultipleRangesLayer && (isLayerGreaterZoomWithMultipleCoverage || isLayerEqualZoomWithMultipleCoverage)
                // multiple coverage ranges
                  ? (
                    <div
                      className="data-panel-coverage-line"
                      style={{
                        width: `${containerLineDimensions.width}px`,
                      }}
                    >
                      {dateRanges && dateRanges.map((range, innerIndex) => {
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
                            const dateIntTime = new Date(dateInt).getTime();
                            const startDateTime = new Date(range.startDate).getTime();
                            const endDateTime = new Date(range.endDate).getTime();
                            // allow overwriting of subsequent date ranges
                            if (dateIntTime >= startDateTime && startDateTime <= endDateTime) {
                              multipleCoverageRangesDateIntervals[dateIntFormatted] = { date: dateInt, interval: rangeInterval };
                            }
                          });
                          // if at the end of dateRanges array, display results from multipleCoverageRangesDateIntervals
                          if (isLastInRange) {
                            const multiDateToDisplay = Object.values(multipleCoverageRangesDateIntervals);
                            return multiDateToDisplay.map((itemRange, multiIndex) => {
                              const { date, interval } = itemRange;
                              const nextDate = multiDateToDisplay[multiIndex + 1];
                              const rangeDateEnd = this.getRangeDateEndWithAddedInterval(date, layerPeriod, interval, nextDate);
                              // get range line dimensions
                              const multiLineRangeOptions = getMatchingCoverageLineDimensions(layer, date, rangeDateEnd);
                              // create DOM line element
                              return multiLineRangeOptions.visible
                                && this.createMatchingCoverageLineDOMEl(
                                  id,
                                  multiLineRangeOptions,
                                  'MULTI',
                                  date,
                                  rangeDateEnd,
                                  lineBackgroundColor,
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
                            lineBackgroundColor,
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
                    lineBackgroundColor,
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
  position: PropTypes.number,
  timeScale: PropTypes.string,
  transformX: PropTypes.number,
};

export default LayerDataItems;
