import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { datesInDateRanges } from '../../../modules/layers/util';
import util from '../../../util/util';
import {
  TIME_SCALE_TO_NUMBER,
} from '../../../modules/date/constants';
import CoverageItemContainer from './coverage-item-container';
import { formatDisplayDate } from '../../../modules/date/util';
import MonospaceDate from '../../util/monospace-date';
import { SIDEBAR_LAYER_HOVER } from '../../../util/constants';

const { events } = util;

// ignore multiple date ranges due to WV config not building to
// handle varying periods in same layer (example: M and D)
const ignoredLayer = {
  GRACE_Tellus_Liquid_Water_Equivalent_Thickness_Mascon_CRI: true,
};

/**
* @desc get layer header with title, subtitle, and full date range
* @param {Object} layer
* @param {Boolean} visible
* @param {String} dateRange
* @param {String} background color
* @returns {DOM Element} header
*/
const getHeaderDOMEl = (layer, visible, layerItemBackground, inactiveLayers) => {
  const titleColor = visible ? '#000' : '#999';
  const textColor = visible ? '#222' : '#999';
  const {
    subtitle, title, startDate, endDate,
  } = layer;
  const formattedStartDate = startDate && formatDisplayDate(new Date(startDate));
  const formattedEndDate = endDate && formatDisplayDate(new Date(endDate));
  const baseStyle = { width: '110px', display: 'inline-block' };
  const getStyle = (date) => (
    date
      ? { ...baseStyle, textAlign: 'center' }
      : { ...baseStyle, paddingLeft: '2px' }
  );

  return (
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
          float: 'left',
          width: inactiveLayers || formattedEndDate ? '205px' : '175px',
        }}
      >
        <MonospaceDate style={getStyle(formattedStartDate)} date={formattedStartDate || ' Start '} />
        {' -  '}
        <MonospaceDate style={getStyle(formattedEndDate)} date={formattedEndDate || ' Present '} />
      </div>
    </div>
  );
};

/**
* @desc get empty layers message DOM element
* @returns {DOM Element} div contained message
*/
const createEmptyLayersDOMEl = () => {
  return (
    <div className="layer-coverage-list-empty">
      <div className="layer-coverage-item-empty">
        <FontAwesomeIcon icon="exclamation-triangle" className="error-icon" widthAuto />
        <p>
          No visible layers with defined coverage. Add layers or toggle
          &quot;Include Hidden Layers&quot; if current layers are hidden.
        </p>
      </div>
    </div>
  );
};

/**
* @desc get formatted time period name
* @param {String} period
* @returns {String} formatted period
*/
const getFormattedTimePeriod = (period) => {
  if (period === 'daily') return 'day';
  if (period === 'monthly') return 'monthly';
  if (period === 'yearly') return 'year';
  return 'minute';
};

/*
 * Layer Coverage Container item list.
 *
 * @function CoverageItemList
 */
const CoverageItemList = ({
  activeLayers,
  appNow,
  axisWidth,
  backDate,
  frontDate,
  getMatchingCoverageLineDimensions,
  positionTransformX,
  timeScale,
}) => {
  const [hoveredLayer, setHoveredLayer] = useState(undefined);

  // cache for queried date arrays
  const layerDateArrayCache = useRef({});

  useEffect(() => {
    const layerHoverCallback = (id, active) => {
      setHoveredLayer(active ? id : undefined);
    };
    events.on(SIDEBAR_LAYER_HOVER, layerHoverCallback);
    return () => {
      events.off(SIDEBAR_LAYER_HOVER, layerHoverCallback);
    };
  }, []);

  /**
  * @desc get range date end with added interval based on period
  * @param {Object} layer def object
  * @param {Object} range date object
  * @param {String} time unit period
  * @param {Number} itemRangeInterval
  * @param {Object} nextDate range object with date
  * @returns {String} rangeDateEnd date ISO string
  */
  const getRangeDateEndWithAddedInterval = (
    layer,
    rangeDate,
    layerPeriod,
    itemRangeInterval,
    nextDate,
  ) => {
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
  };

  /**
  * @desc get endDateLimit based on axis and appNow
  * @param {Object} layer def object
  * @param {Boolean} isLastInRange
  * @returns {Object} endDateLimit date object
  */
  const getMaxEndDate = (layer, isLastInRange) => {
    const { endDate, futureTime, ongoing } = layer;

    let endDateLimit = new Date(backDate);
    const layerEndDate = new Date(endDate);
    const appNowDate = new Date(appNow);
    // appNow will override max range endDate
    if (endDateLimit > appNowDate && !futureTime) {
      endDateLimit = appNowDate;
    }
    // if last date of multiple ranges check for endDate over appNow date
    if (ongoing && isLastInRange) {
      if (futureTime && endDate) {
        if (endDateLimit > layerEndDate) {
          endDateLimit = layerEndDate;
        }
      } else if (endDateLimit > appNowDate) {
        endDateLimit = appNowDate;
      }
    }

    return endDateLimit;
  };

  /**
  * @desc get array of dates for layer
  * @param {Object} def - layer
  * @param {Object} range
  * @param {Object} endDateLimit
  * @param {Boolean} isLastInRange
  * @returns {Array} dateIntervalStartDates
  */
  const getDatesInDateRange = (def, range, endDateLimit, isLastInRange) => {
    const {
      futureTime, period, id, ongoing,
    } = def;
    const { dateInterval, startDate, endDate } = range;

    const layerPeriod = getFormattedTimePeriod(period);
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
    if (ongoing && isLastInRange) {
      if (futureTime) {
        rangeEnd = new Date(endDate);
      } else {
        rangeEnd = appNowDate;
      }
    }

    // get dates within given date range
    let dateIntervalStartDates = [];
    const startLessThanOrEqualToEndDateLimit = startDateObj.getTime() <= endDateLimit.getTime();
    const endGreaterThanOrEqualToStartDateLimit = new Date(rangeEnd)
      .getTime() >= startDateLimit.getTime();
    if (startLessThanOrEqualToEndDateLimit && endGreaterThanOrEqualToStartDateLimit) {
      // check layer date array cache and use caches date array if available, if not add date array
      const cache = layerDateArrayCache.current;
      cache[id] ??= {};

      const layerIdDates = `${appNow.toISOString()}-${frontDate}-${backDate}`;
      if (cache[id][layerIdDates] === undefined) {
        dateIntervalStartDates = datesInDateRanges(
          def,
          startDateLimit,
          startDateLimit,
          endDateLimit,
          appNow,
        );
        cache[id][layerIdDates] = dateIntervalStartDates;
      } else {
        dateIntervalStartDates = cache[id][layerIdDates];
      }
    }
    return dateIntervalStartDates;
  };

  /**
  * @desc get conditional styling for layer container and coverage line
  * @param {Boolean} visible
  * @param {String} id
  * @returns {Object}
  *   @param {String} lineBackgroundColor
  *   @param {String} layerItemBackground
  *   @param {String} layerItemOutline
  */
  const getLayerItemStyles = (visible, id) => {
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
  };

  const emptyLayers = activeLayers.length === 0;
  const inactiveLayers = activeLayers.some(({ ongoing }) => !ongoing);
  return (
    <div className="layer-coverage-layer-list">
      {/* Empty layer coverage message */
        emptyLayers && createEmptyLayersDOMEl()
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
          let layerPeriod = getFormattedTimePeriod(period);

          // get layer scale number to determine relation to current axis zoom level
          const timeScaleNumber = TIME_SCALE_TO_NUMBER[timeScale];
          const layerScaleNumber = TIME_SCALE_TO_NUMBER[layerPeriod];
          const isLayerGreaterIncrementThanZoom = layerScaleNumber < timeScaleNumber;
          const isLayerEqualIncrementThanZoom = layerScaleNumber === timeScaleNumber;

          // concat (ex: day to days) for moment manipulation below
          layerPeriod += 's';

          // conditional styling for line/background colors
          const {
            layerItemBackground,
            layerItemOutline,
          } = getLayerItemStyles(visible, id);

          // get date range
          const dateRangeIntervalZeroIndex = dateRanges
            ? Number(dateRanges[0].dateInterval)
            : 1;

          // conditional check to determine how layer coverage line
          // will be built in child component
          const isLayerGreaterZoomWithMultipleCoverage = isLayerGreaterIncrementThanZoom &&
        (multipleCoverageRanges || dateRangeIntervalZeroIndex);
          const isLayerEqualZoomWithMultipleCoverage = isLayerEqualIncrementThanZoom &&
        dateRangeIntervalZeroIndex > 1;
          // determine date range building vs using startDate to endDate single coverage
          const needDateRangeBuilt = !!(isValidLayer && (isLayerGreaterZoomWithMultipleCoverage ||
          isLayerEqualZoomWithMultipleCoverage));
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
                getHeaderDOMEl(
                  layer, visible, layerItemBackground, inactiveLayers,
                )
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
                  getLayerItemStyles={getLayerItemStyles}
                  getMaxEndDate={getMaxEndDate}
                  getDatesInDateRange={getDatesInDateRange}
                  axisWidth={axisWidth}
                  positionTransformX={positionTransformX}
                  layer={layer}
                  layerPeriod={layerPeriod}
                  getMatchingCoverageLineDimensions={getMatchingCoverageLineDimensions}
                  getRangeDateEndWithAddedInterval={getRangeDateEndWithAddedInterval}
                  needDateRangeBuilt={needDateRangeBuilt}
                />
              </div>
            </div>
          );
        })
      }
    </div>
  );
};

CoverageItemList.propTypes = {
  activeLayers: PropTypes.oneOfType([PropTypes.array, PropTypes.oneOf(['null'])]),
  appNow: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf(['null'])]),
  axisWidth: PropTypes.number,
  backDate: PropTypes.string,
  frontDate: PropTypes.string,
  getMatchingCoverageLineDimensions: PropTypes.func,
  positionTransformX: PropTypes.number,
  timeScale: PropTypes.string,
};

export default CoverageItemList;
