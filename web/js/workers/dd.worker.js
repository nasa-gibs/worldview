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
 * @method mergeSortedGranuleDateRanges
 * @param {array} granules
 * @returns {array} mergedGranuleDateRanges
 * @description
 * Merge overlapping granule date ranges
*/
function mergeDomains(domains) {
  const dateRanges = domains.split(',').map((range) => range.split('/'));

  const mergedDateRanges = dateRanges.reduce((acc, [start, end]) => {
    if (!acc.length) return [[start, end]];
    // round start time down and end time up by 7 minutes to account for small range gaps
    const startTime = makeTime(start) - 420000;
    const endTime = makeTime(end) + 420000;
    const lastRangeEndTime = makeTime(acc.at(-1)[1]);
    const lastRangeStartTime = makeTime(acc.at(-1)[0]);
    if ((startTime >= lastRangeStartTime && startTime <= lastRangeEndTime) && (endTime >= lastRangeStartTime && endTime <= lastRangeEndTime)) { // within current range, ignore
      return acc;
    }
    if (startTime > lastRangeEndTime) { // discontinuous, add new range
      return [...acc, [start, end]];
    }
    if (startTime <= lastRangeEndTime && endTime > lastRangeEndTime) { // intersects current range, merge
      return acc.with(-1, [acc.at(-1)[0], end]);
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
