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
  } = params;

  const start = new Date(startDate).toISOString().replace('.000', '');
  const end = new Date(endDate).toISOString().replace('.000', '');

  const describeDomainsUrl = `https://gibs.earthdata.nasa.gov/wmts/${projDict[proj]}/best/1.0.0/${id}/default/250m/all/${start}--${end}.xml`;
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
  const oneMinute = 60_000;
  const oneHour = 3_600_000;
  const oneDay = 86_400_000;
  const lookup = {
    M: oneMinute,
    H: oneHour,
    D: oneDay,
  };
  const match = period.match(/[0-9]+/i);
  const number = Number(match[0]);
  const unit = period.at(-1);
  const time = number * lookup[unit];

  if (Number.isNaN(time)) return 360_000;

  return time;
}

/**
 * @method mergeDomains
 * @param {array} domains
 * @param {number} timeBuffer
 * @returns {array} mergedDateRanges
 * @description
 * Merge overlapping date ranges
*/
function mergeDomains(domains, timeBuffer) {
  const dateRanges = domains.split(',').map((range) => range.split('/'));

  const mergedDateRanges = dateRanges.reduce((acc, [start, end, period]) => {
    // convert start and end to time values
    const startTime = makeTime(start);
    let endTime = makeTime(end);

    // if start and end are the same, add period
    if (startTime === endTime) {
      endTime += periodToTime(period);
    }

    if (!acc.length) return [[makeDateString(startTime), makeDateString(endTime)]]; // add the first range to the accumulator

    // round start time down and end time up by a set time to account for small range gaps
    const bufferedStartTime = startTime - timeBuffer;
    const bufferedEndTime = endTime + timeBuffer;

    const lastRangeEndTime = makeTime(acc.at(-1)[1]);
    const lastRangeStartTime = makeTime(acc.at(-1)[0]);

    if ((bufferedStartTime >= lastRangeStartTime && bufferedStartTime <= lastRangeEndTime) && (bufferedEndTime >= lastRangeStartTime && bufferedEndTime <= lastRangeEndTime)) { // within current range, ignore
      return acc;
    }

    if (bufferedStartTime > lastRangeEndTime) { // discontinuous, add new range
      return [...acc, [makeDateString(startTime), makeDateString(endTime)]];
    }

    if (bufferedStartTime <= lastRangeEndTime && bufferedEndTime > lastRangeEndTime) { // intersects current range, merge
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
