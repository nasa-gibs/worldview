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
function mergeSortedGranuleDateRanges(granules) {
  return granules.reduce((acc, [start, end]) => {
    if (!acc.length) return [[start, end]];
    // round start time down and end time up by 1 minute to account for small range gaps
    const startTime = makeTime(start) - 60000;
    const endTime = makeTime(end) + 60000;
    const lastRangeEndTime = makeTime(acc.at(-1)[1]);
    const lastRangeStartTime = makeTime(acc.at(-1)[0]);
    // within current range, ignore
    if ((startTime >= lastRangeStartTime
      && startTime <= lastRangeEndTime)
      && (endTime >= lastRangeStartTime && endTime <= lastRangeEndTime)) {
      return acc;
    }
    if (startTime > lastRangeEndTime) { // discontinuous, add new range
      return [...acc, [start, end]];
    }
    if (startTime <= lastRangeEndTime
      && endTime > lastRangeEndTime) { // intersects current range, merge
      return acc.with(-1, [acc.at(-1)[0], end]);
    }
    return acc;
  }, []);
}


/**
 * @method requestGranules
 * @param {object} params
 * @returns {array} granules
 * @description
 * Request granules from CMR
*/
async function requestGranules(params) {
  const {
    shortName,
    extent,
    startDate,
    endDate,
  } = params;
  const granules = [];
  let hits = Infinity;
  let searchAfter = false;
  const url = `https://cmr.earthdata.nasa.gov/search/granules.json?shortName=${shortName}&bounding_box=${extent.join(',')}&temporal=${startDate}/${endDate}&sort_key=start_date&pageSize=2000`;
  /* eslint-disable no-await-in-loop */
  do { // run the query at least once
    const headers = searchAfter ? { 'Cmr-Search-After': searchAfter, 'Client-Id': 'Worldview' } : { 'Client-Id': 'Worldview' };
    const res = await fetch(url, { headers });
    searchAfter = res.headers.get('Cmr-Search-After');
    hits = parseInt(res.headers.get('Cmr-Hits'), 10);
    const data = await res.json();
    granules.push(...data.feed.entry);
  } while (searchAfter || hits > granules.length); // searchAfter will not be present if there are no more results https://cmr.earthdata.nasa.gov/search/site/docs/search/api.html#search-after

  return granules;
}

/**
 * @method getLayerGranuleRanges
 * @param {object} layer
 * @returns {array} granuleDateRanges
 * @description
 * Get granule date ranges for a given layer
*/
async function getLayerGranuleRanges(layer) {
  const extent = [-180, -90, 180, 90];
  const startDate = new Date(layer.startDate).toISOString();
  const endDate = layer.endDate ? new Date(layer.endDate).toISOString() : new Date().toISOString();
  const shortName = layer.conceptIds?.[0]?.shortName;
  const nrtParams = {
    shortName,
    extent,
    startDate,
    endDate,
  };
  const nrtGranules = await requestGranules(nrtParams);
  let nonNRTGranules = [];
  if (shortName.includes('_NRT')) { // if NRT, also get non-NRT granules
    const nonNRTShortName = shortName.replace('_NRT', '');
    const nonNRTParams = {
      shortName: nonNRTShortName,
      extent,
      startDate,
      endDate,
    };
    nonNRTGranules = await requestGranules(nonNRTParams);
  }
  const granules = [...nonNRTGranules, ...nrtGranules];
  const granuleDateRanges = granules.map(({
    time_start: timeStart,
    time_end: timeEnd,
  }) => [timeStart, timeEnd]);
  // merge overlapping granule ranges to simplify rendering
  const mergedGranuleDateRanges = mergeSortedGranuleDateRanges(granuleDateRanges);

  return mergedGranuleDateRanges;
}


const functions = {
  getLayerGranuleRanges,
};

onmessage = async (event) => {
  const { data } = event;
  const result = await functions[data.operation]?.(...data.args);
  postMessage(result);
};
