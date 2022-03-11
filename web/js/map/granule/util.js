import OlGeomLineString from 'ol/geom/LineString';
import util from '../../util/util';

/**
 * Helper to find index for date string to add to sorted array of date strings
 *
 * @method getIndexForSortedInsert
 * @static
 * @param {object} array - array of dates (already sorted)
 * @param {string} date - date string ISO format
 * @returns {number} index
 */
export const getIndexForSortedInsert = (array, date) => {
  const newDate = new Date(date);
  const len = array.length;
  if (new Date(array[0]) > newDate) {
    return 0;
  }
  let i = 1;
  while (i < len && !(new Date(array[i]) > newDate && new Date(array[i - 1]) <= newDate)) {
    i += 1;
  }
  return i;
};

/**
 * Helper to check date is within known start/end range (if given, else false)
 *
 * @method isWithinDateRange
 * @static
 * @param {object} date - date object
 * @param {object} startDate - date object
 * @param {string} endDate - date object
 * @returns {boolean}
 */
export const isWithinDateRange = (date, startDate, endDate) => (startDate && endDate
  ? date.getTime() <= new Date(endDate).getTime() && date.getTime() >= new Date(startDate).getTime()
  : false);

/**
 * Get CMR query dates for building query string and child processes
 *
 * @method getCMRQueryDates
 * @static
 * @param {object} selectedDate - date object
 * @returns {object}
    * @param {object} startQueryDate - date object
    * @param {object} endQueryDate - date object
  */
export const getCMRQueryDates = (selectedDate) => {
  // check if selectedDate is before or after 12 to determine date request range
  const date = new Date(selectedDate);
  const isDateAfterNoon = date.getUTCHours() > 12;

  const zeroedDate = util.clearTimeUTC(date);

  const dayBeforeDate = util.dateAdd(zeroedDate, 'day', -1);
  const dayAfterDate = util.dateAdd(zeroedDate, 'day', 1);
  const twoDayAfterDate = util.dateAdd(zeroedDate, 'day', 2);

  const startQueryDate = dayBeforeDate;
  let endQueryDate = isDateAfterNoon
    ? twoDayAfterDate
    : dayAfterDate;

  // set current date if on leading edge of time coverage
  endQueryDate = endQueryDate > new Date()
    ? new Date()
    : endQueryDate;

  return {
    startQueryDate,
    endQueryDate,
  };
};

/**
 * Get CMR query date update options to determine if selected date is within existing date range
 * and/or if that range can be extended vs updating
 *
 * @method getCMRQueryDateUpdateOptions
 * @static
 * @param {object} CMRDateStoreForLayer - cmr date store object with ranges
 * @param {object} date - date object
 * @param {object} startQueryDate - date object
 * @param {object} endQueryDate - date object
 * @returns {object}
    * @param {boolean} canExtendRange
    * @param {boolean} needRangeUpdate
    * @param {object} rangeStart - date object
    * @param {object} rangeEnd - date object
  */
export const getCMRQueryDateUpdateOptions = (CMRDateStoreForLayer, date, startQueryDate, endQueryDate) => {
  let canExtendRange = false;
  let needRangeUpdate = true;
  let rangeStart;
  let rangeEnd;

  if (!CMRDateStoreForLayer) {
    return {
      canExtendRange,
      needRangeUpdate,
    };
  }

  // need to determine start and end
  const dateTime = date.getTime();
  const newStartTime = startQueryDate.getTime();
  const newEndTime = endQueryDate.getTime();

  const currentStartTime = CMRDateStoreForLayer.startDate.getTime();
  const currentEndTime = CMRDateStoreForLayer.endDate.getTime();

  // boolean comparison checks for date relativity
  const newStartBeforeCurrentCMRStart = newStartTime < currentStartTime;
  const newStartSameOrBeforeCurrentCMREnd = newStartTime < currentEndTime;

  const newStartAfterCurrentCMRStart = newStartTime > currentStartTime;
  const newEndSameOrAfterCurentCMRStart = newEndTime >= currentStartTime;

  const newStartSameOrAfterCurrentStart = newStartTime >= currentStartTime;
  const newEndSameOrBeforeCurrentEnd = newEndTime <= currentEndTime;

  const newStartEqualsCurrentCMREnd = newStartTime === currentEndTime;
  const newEndEqualsCurrentCMRStart = newEndTime === currentStartTime;

  const newEndCanExtendCurrentCMREnd = newStartBeforeCurrentCMRStart && newEndSameOrAfterCurentCMRStart;
  const newStartCanExtendCurrentCMRStart = newStartAfterCurrentCMRStart && newStartSameOrBeforeCurrentCMREnd;

  if (newStartSameOrAfterCurrentStart && newEndSameOrBeforeCurrentEnd) {
    needRangeUpdate = false;
  }

  // add 1 day to start time to allow cushion for filtered out DAY/NIGHT flags on granules
  const currentStartTimePlusOne = util.dateAdd(new Date(currentStartTime), 'day', 1);
  const currentStartTimePlusOneTime = currentStartTimePlusOne.getTime();

  const dateSameOrAfterCurrentCMRStartPlusOne = dateTime >= currentStartTimePlusOneTime;
  const dateSameOrBeforeCurrentCMREnd = dateTime <= currentEndTime;

  if (dateSameOrAfterCurrentCMRStartPlusOne && dateSameOrBeforeCurrentCMREnd) {
    needRangeUpdate = false;
  } else {
    // ex: current      [4][5][6][7][8]
    //     new [1][2][3][4][5]
    // ex: current            [6][7][8][9][10]
    //     new [1][2][3][4][5]
    if (newEndEqualsCurrentCMRStart || newEndCanExtendCurrentCMREnd) {
      rangeStart = newStartTime;
      rangeEnd = currentEndTime;
      canExtendRange = true;
    }
    // ex: current [1][2][3][4][5]
    //     new              [4][5][6][7][8]
    // ex: current [1][2][3][4][5]
    //     new                    [6][7][8][9][10]
    if (newStartEqualsCurrentCMREnd || newStartCanExtendCurrentCMRStart) {
      rangeStart = currentStartTime;
      rangeEnd = newEndTime;
      canExtendRange = true;
    }
  }

  return {
    canExtendRange,
    needRangeUpdate,
    rangeStart,
    rangeEnd,
  };
};


export const getGranuleDateData = (entry, date, projection) => {
  const line = new OlGeomLineString([]);
  const maxDistance = projection === 'geographic' ? 270 : Number.POSITIVE_INFINITY;
  const polygons = entry.polygons[0][0].split(' ');
  const dayNight = entry.day_night_flag;

  // build the array of arrays polygon
  let polygonReorder = [];
  for (let i = 0; i < polygons.length; i += 2) {
    const coordPair = [];
    coordPair.unshift(polygons[i]);
    coordPair.unshift(polygons[i + 1]);
    polygonReorder.push(coordPair);
  }

  // add coordinates that exceeed max distance to table for revision
  const coordOverMaxDistance = {};
  const firstCoords = polygonReorder[0];
  for (let j = 0; j < polygonReorder.length; j += 1) {
    // get current long coord in pair and measure against first coord to get length
    const currentCoords = polygonReorder[j];
    line.setCoordinates([firstCoords, currentCoords]);
    const lineLength = line.getLength();

    // if length is over max distance (geographic restriction only) add to table
    if (lineLength > maxDistance) {
      const longCoord = currentCoords[0];
      if (coordOverMaxDistance[longCoord]) {
        coordOverMaxDistance[longCoord] += 1;
      } else {
        coordOverMaxDistance[longCoord] = 1;
      }
    }
  }

  // check if long coord exceeded max and revise coord +/- 360 to handle meridian crossing
  const coordinatesRevised = Object.keys(coordOverMaxDistance).length >= 1;
  if (coordinatesRevised) {
    polygonReorder = polygonReorder.map((coord) => {
      const ind0 = coord[0];
      if (coordOverMaxDistance[ind0] && coordOverMaxDistance[ind0] >= 1) {
        const numInd0 = Number(ind0);
        const revise = numInd0 > 0
          ? numInd0 - 360
          : numInd0 + 360;
        coord[0] = revise.toString();
      }
      return coord;
    });
  }

  return {
    date,
    polygons: polygonReorder,
    dayNight,
  };
};

