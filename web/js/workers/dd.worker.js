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

  const describeDomainsUrl = `https://gibs.earthdata.nasa.gov/wmts/${projDict[proj]}/best/1.0.0/${id}/default/250m/all/${startDate.split('T')[0]}--${endDate.split('T')[0]}.xml`;
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

const periodDict = {
  PT6M: 360_000,
  PT30M: 1_800_000,
  PT10M: 600_000,
};

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
      endTime += periodDict[period] || 360_000;
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
