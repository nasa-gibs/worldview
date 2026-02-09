const projDict = {
  'EPSG:4326': 'epsg4326',
  'EPSG:3413': 'epsg3413',
  'EPSG:3031': 'epsg3031',
};

/**
 * @method requestDescribeDomains
 * @param {object} params
 * @returns {string} describeDomainsText
 * @description
 * Request DescribeDomains from GIBS
 */
async function requestDescribeDomains(params) {
  const {
    id,
    startDate,
    endDate,
    proj,
    baseUrl,
  } = params;

  const start = `${new Date(startDate).toISOString().split('.')[0]}Z`;
  const end = `${new Date(endDate).toISOString().split('.')[0]}Z`;

  const describeDomainsUrl = `${baseUrl}/wmts/${projDict[proj]}/best/1.0.0/${id}/default/250m/all/${start}--${end}.xml`;
  const describeDomainsResponse = await fetch(describeDomainsUrl);
  const describeDomainsText = await describeDomainsResponse.text();

  return describeDomainsText;
}

/**
 * @method makeTime
 * @param {string} date
 * @returns {number} time
 * @description
 * Convert date to time
*/
function makeTime(date) {
  return new Date(date).getTime();
}

/**
 * @method makeDateString
 * @param {number} time
 * @returns {string} dateString
 * @description
 * Convert time to date string
*/
function makeDateString(time) {
  return new Date(time).toISOString();
}

/**
 * @method periodToTime
 * @param {string} period
 * @returns {number} time
 * @description
 * Convert period to time
*/
function periodToTime(period) {
  const oneSecond = 1_000;
  const oneMinute = 60_000;
  const oneHour = 3_600_000;
  const oneDay = 86_400_000;
  const lookup = {
    S: oneSecond,
    M: oneMinute,
    H: oneHour,
    D: oneDay,
  };
  const processedPeriod = period.replace('PT', '');
  const numberMatch = processedPeriod.match(/[0-9]+/g);
  const unitMatch = processedPeriod.match(/[a-zA-Z]+/g);
  const time = numberMatch.reduce((acc, val, idx) => {
    const number = Number(val);
    const unit = unitMatch[idx];
    const milliseconds = number * lookup[unit?.toUpperCase?.()];
    const invalid = Number.isNaN(milliseconds);
    const valueToAdd = invalid ? (console.warn(`Invalid period: ${period}`), 0) : milliseconds;
    return acc + valueToAdd;
  }, 0);

  return time || 360_000;
}

/**
 * @method mergeDomains
 * @param {array} domains
 * @param {number} timeBuffer
 * @param {boolean} keepDateIntervals
 * @returns {array} mergedDateRanges
 * @description
 * Merge overlapping date ranges
*/
function mergeDomains(domains, timeBuffer, keepDateIntervals = false) {
  const dateRanges = domains.split(',').map((range) => range.split('/'));

  const mergedDateRanges = dateRanges.reduce((acc, [start, end, period]) => {
    // convert start and end to time values
    const startTime = makeTime(start);
    let endTime = makeTime(end);
    const formattedPeriod = keepDateIntervals ? [period.match(/\d+/)[0]] : [];

    // if start and end are the same, add period
    if (startTime === endTime) {
      endTime += periodToTime(period);
    }

    if (!acc.length) {
      return [[makeDateString(startTime),
        makeDateString(endTime),
        ...formattedPeriod]];
    } // add the first range to the accumulator

    // round start time down and end time up by a set time to account for small range gaps
    const bufferedStartTime = startTime - timeBuffer;
    const bufferedEndTime = endTime + timeBuffer;

    const lastRangeEndTime = makeTime(acc.at(-1)[1]);
    const lastRangeStartTime = makeTime(acc.at(-1)[0]);

    if ((bufferedStartTime >= lastRangeStartTime
      && bufferedStartTime <= lastRangeEndTime)
      && (bufferedEndTime >= lastRangeStartTime
        && bufferedEndTime <= lastRangeEndTime)) { // within current range, ignore
      return acc;
    }

    // discontinuous, add new range
    if (bufferedStartTime > lastRangeEndTime || keepDateIntervals) {
      return [...acc, [makeDateString(startTime), makeDateString(endTime),
        ...formattedPeriod]];
    }

    // intersects current range, merge
    if (bufferedStartTime <= lastRangeEndTime
      && bufferedEndTime > lastRangeEndTime && !keepDateIntervals) {
      return acc.with(-1, [acc.at(-1)[0], makeDateString(endTime)]);
    }

    return acc;
  }, []);

  return mergedDateRanges;
}


const functions = {
  requestDescribeDomains,
  mergeDomains,
};

onmessage = async (event) => {
  const { data } = event;
  const result = await functions[data.operation]?.(...data.args);
  postMessage(result);
};
