import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { datesInDateRanges } from '../../../modules/layers/util';
import util from '../../../util/util';
import {
  timeScaleToNumberKey,
} from '../../../modules/date/constants';
import CoverageItemContainer from './coverage-item-container';

const { events } = util;

// ignore multiple date ranges due to WV config not building to
// handle varying periods in same layer (example: M and D)
const ignoredLayer = {
  GRACE_Tellus_Liquid_Water_Equivalent_Thickness_Mascon_CRI: true,
};

/*
 * Layer Coverage Container item list.
 *
 * @class CoverageItemList
 */
class CoverageItemList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hoveredLayer: undefined,
    };

    // cache for queried date arrays
    this.layerDateArrayCache = {};
  }

  componentDidMount() {
    events.on('sidebar:layer-hover', this.layerHoverCallback);
  }

  componentWillUnmount() {
    events.off('sidebar:layer-hover', this.layerHoverCallback);
  }

  layerHoverCallback = (id, active) => {
    this.setState({ hoveredLayer: active ? id : undefined });
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
    const { subtitle, title } = layer;
    return (
      <>
        <div className="layer-coverage-item-header">
          <div
            className="layer-coverage-item-title"
            style={{
              color: titleColor,
            }}
          >
            {title}
            {' '}
            <span
              className="layer-coverage-item-subtitle"
              style={{
                color: textColor,
              }}
            >
              {subtitle}
            </span>
          </div>
          <div
            className="layer-coverage-item-date-range"
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
  * @desc get formatted time period name
  * @param {String} period
  * @returns {String} formatted period
  */
  getFormattedTimePeriod = (period) => (period === 'daily'
    ? 'day'
    : period === 'monthly'
      ? 'month'
      : period === 'yearly'
        ? 'year'
        : 'minute')

  /**
  * @desc get range date end with added interval based on period
  * @param {Object} layer def object
  * @param {Object} range date object
  * @param {String} time unit period
  * @param {Number} itemRangeInterval
  * @param {Object} nextDate range object with date
  * @returns {String} rangeDateEnd date ISO string
  */
  getRangeDateEndWithAddedInterval = (layer, rangeDate, layerPeriod, itemRangeInterval, nextDate) => {
    const { appNow } = this.props;
    const { endDate, futureTime } = layer;
    const {
      minYear,
      minMonth,
      minDay,
      minHour,
      minMinute,
    } = util.getUTCNumbers(rangeDate, 'min');
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

    let rangeDateEnd = util.getTimezoneOffsetDate(rangeDateEndLocal);
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
      if (futureTime) {
        rangeDateEnd = new Date(endDate) > rangeDateEnd
          ? rangeDateEnd
          : new Date(endDate);
      } else {
        rangeDateEnd = appNow;
      }
    }
    return new Date(rangeDateEnd).toISOString();
  }

  /**
  * @desc get formatted, readable date range for header
  * @param {Object} layer
  * @returns {String} dateRangeText
  */
  getFormattedDateRange = (layer) => {
    // get start date -or- 'start'
    const {
      endDate, startDate,
    } = layer;
    let dateRangeStart;
    if (startDate) {
      const yearMonthDaySplit = startDate.split('T')[0].split('-');
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
    if (endDate) {
      const yearMonthDaySplit = endDate.split('T')[0].split('-');
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
  * @param {Object} layer def object
  * @param {Boolean} isLastInRange
  * @returns {Object} endDateLimit date object
  */
  getMaxEndDate = (layer, isLastInRange) => {
    const {
      appNow,
      backDate,
    } = this.props;
    const { endDate, futureTime, inactive } = layer;

    let endDateLimit = new Date(backDate);
    const layerEndDate = new Date(endDate);
    const appNowDate = new Date(appNow);
    // appNow will override max range endDate
    if (endDateLimit > appNowDate && !futureTime) {
      endDateLimit = appNowDate;
    }
    // if last date of multiple ranges check for endDate over appNow date
    if (!inactive && isLastInRange) {
      if (futureTime && endDate) {
        if (endDateLimit > layerEndDate) {
          endDateLimit = layerEndDate;
        }
      } else if (endDateLimit > appNowDate) {
        endDateLimit = appNowDate;
      }
    }

    return endDateLimit;
  }

  /**
  * @desc get array of dates for layer
  * @param {Object} def - layer
  * @param {Object} range
  * @param {Object} endDateLimit
  * @param {Boolean} isLastInRange
  * @returns {Array} dateIntervalStartDates
  */
  getDatesInDateRange = (def, range, endDateLimit, isLastInRange) => {
    const {
      appNow,
      backDate,
      frontDate,
    } = this.props;
    const {
      futureTime, period, id, inactive,
    } = def;
    const { dateInterval, startDate, endDate } = range;

    const layerPeriod = this.getFormattedTimePeriod(period);
    const rangeInterval = Number(dateInterval);
    let rangeEnd;

    const startDateObj = new Date(startDate);
    const frontDateObj = new Date(frontDate);
    // limit start date based on layer range instead of axis front date
    let startDateLimit = startDateObj > frontDateObj
      ? startDateObj
      : frontDateObj;

    // get leading start date minus rangeInterval and add to end date
    startDateLimit = moment.utc(startDateLimit).subtract(rangeInterval, layerPeriod);
    startDateLimit = moment(startDateLimit).toDate();
    rangeEnd = moment.utc(endDate).add(rangeInterval, layerPeriod);
    rangeEnd = moment(endDate).toDate();

    // rangeEnd for last time coverage section of active layers can't be greater than appNow
    const appNowDate = new Date(appNow);
    if (!inactive && isLastInRange) {
      if (futureTime) {
        rangeEnd = new Date(endDate);
      } else {
        rangeEnd = appNowDate;
      }
    }

    // get dates within given date range
    let dateIntervalStartDates = [];
    const startLessThanOrEqualToEndDateLimit = startDateObj.getTime() <= endDateLimit.getTime();
    const endGreaterThanOrEqualToStartDateLimit = new Date(rangeEnd).getTime() >= startDateLimit.getTime();
    if (startLessThanOrEqualToEndDateLimit && endGreaterThanOrEqualToStartDateLimit) {
      // check layer date array cache and use caches date array if available, if not add date array
      if (!this.layerDateArrayCache[id]) {
        this.layerDateArrayCache[id] = {};
      }

      const layerIdDates = `${appNow.toISOString()}-${frontDate}-${backDate}`;
      if (this.layerDateArrayCache[id][layerIdDates] === undefined) {
        dateIntervalStartDates = datesInDateRanges(def, startDateLimit, startDateLimit, endDateLimit, appNow);
        this.layerDateArrayCache[id][layerIdDates] = dateIntervalStartDates;
      } else {
        dateIntervalStartDates = this.layerDateArrayCache[id][layerIdDates];
      }
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
    const { hoveredLayer } = this.state;
    // conditional styling for line/background colors
    const containerBackgroundColor = visible
      ? 'rgb(204, 204, 204)'
      : 'rgb(79, 79, 79)';
    // lighten layer container on sidebar hover
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

  /**
  * @desc get empty layers message DOM element
  * @returns {DOM Element} div contained message
  */
  createEmptyLayersDOMEl = () => (
    <div className="layer-coverage-list-empty">
      <div className="layer-coverage-item-empty">
        <FontAwesomeIcon icon="exclamation-triangle" className="error-icon" />
        <p>No visible layers with defined coverage. Add layers or toggle &quot;Include Hidden Layers&quot; if current layers are hidden.</p>
      </div>
    </div>
  )

  render() {
    const {
      activeLayers,
      axisWidth,
      backDate,
      frontDate,
      getMatchingCoverageLineDimensions,
      timeScale,
      positionTransformX,
    } = this.props;
    const emptyLayers = activeLayers.length === 0;
    return (
      <div className="layer-coverage-layer-list">
        {/* Empty layer coverage message */
          emptyLayers && this.createEmptyLayersDOMEl()
        }

        {/* Build individual layer coverage components */
        activeLayers.map((layer, index) => {
          const {
            dateRanges,
            id,
            period,
            startDate,
            visible,
          } = layer;
          if (!dateRanges && !startDate) {
            return null;
          }
          // check for multiple date ranges
          let multipleCoverageRanges = false;
          const isValidLayer = !ignoredLayer[id] && dateRanges;
          if (isValidLayer) {
            multipleCoverageRanges = dateRanges.length > 1;
          }
          let layerPeriod = this.getFormattedTimePeriod(period);

          // get layer scale number to determine relation to current axis zoom level
          const timeScaleNumber = timeScaleToNumberKey[timeScale];
          const layerScaleNumber = timeScaleToNumberKey[layerPeriod];
          const isLayerGreaterIncrementThanZoom = layerScaleNumber < timeScaleNumber;
          const isLayerEqualIncrementThanZoom = layerScaleNumber === timeScaleNumber;

          // concat (ex: day to days) for moment manipulation below
          layerPeriod += 's';

          // conditional styling for line/background colors
          const {
            layerItemBackground,
            layerItemOutline,
          } = this.getLayerItemStyles(visible, id);

          // get date range
          const dateRange = this.getFormattedDateRange(layer);
          const dateRangeIntervalZeroIndex = dateRanges
            ? Number(dateRanges[0].dateInterval)
            : 1;

          // conditional check to determine how layer coverage line will be built in child component
          const isLayerGreaterZoomWithMultipleCoverage = isLayerGreaterIncrementThanZoom && (multipleCoverageRanges || dateRangeIntervalZeroIndex);
          const isLayerEqualZoomWithMultipleCoverage = isLayerEqualIncrementThanZoom && dateRangeIntervalZeroIndex > 1;
          // determine date range building vs using startDate to endDate single coverage
          const needDateRangeBuilt = !!(isValidLayer && (isLayerGreaterZoomWithMultipleCoverage || isLayerEqualZoomWithMultipleCoverage));
          const encodedId = util.encodeId(id);
          const key = `layer-coverage-item-${encodedId}-${index}`;

          return (
            <div
              key={key}
              className="layer-coverage-layer-list-item"
              style={{
                background: layerItemBackground,
                outline: layerItemOutline,
              }}
            >
              {/* Layer Header DOM El */
                this.getHeaderDOMEl(layer, visible, dateRange, layerItemBackground)
              }
              <div
                className="layer-coverage-line-container"
                style={{
                  maxWidth: `${axisWidth}px`,
                }}
              >
                <CoverageItemContainer
                  frontDate={frontDate}
                  backDate={backDate}
                  getLayerItemStyles={this.getLayerItemStyles}
                  getMaxEndDate={this.getMaxEndDate}
                  getDatesInDateRange={this.getDatesInDateRange}
                  axisWidth={axisWidth}
                  positionTransformX={positionTransformX}
                  layer={layer}
                  layerPeriod={layerPeriod}
                  getMatchingCoverageLineDimensions={getMatchingCoverageLineDimensions}
                  getRangeDateEndWithAddedInterval={this.getRangeDateEndWithAddedInterval}
                  needDateRangeBuilt={needDateRangeBuilt}
                />
              </div>
            </div>
          );
        })
        }
      </div>
    );
  }
}

CoverageItemList.propTypes = {
  activeLayers: PropTypes.array,
  appNow: PropTypes.object,
  axisWidth: PropTypes.number,
  backDate: PropTypes.string,
  frontDate: PropTypes.string,
  getMatchingCoverageLineDimensions: PropTypes.func,
  positionTransformX: PropTypes.number,
  timeScale: PropTypes.string,
};

export default CoverageItemList;
