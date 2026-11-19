import util from './util';

export const CMR_CLIENT_ID = 'Worldview';

export const CMR_REQUEST_OPTIONS = {
  headers: { 'Client-Id': CMR_CLIENT_ID },
};

/**
 * Fetch wrapper that automatically includes the CMR Client-Id header.
 * Returns the raw Response object so callers can handle parsing.
 */
export async function cmrFetch(url, options = {}) {
  const { headers: extraHeaders, ...restOptions } = options;
  const headers = {
    ...CMR_REQUEST_OPTIONS.headers,
    ...extraHeaders,
  };
  return fetch(url, { ...restOptions, headers });
}

/**
 * Fetch all pages of CMR results using Cmr-Search-After pagination.
 * Returns { entries, hits }.
 */
export async function cmrSearchAfterFetch(url, options = {}) {
  const entries = [];
  let hits = Infinity;
  let searchAfter = false;

  do {
    const headers = searchAfter
      ? { 'Cmr-Search-After': searchAfter }
      : {};
    const res = await cmrFetch(url, { ...options, headers: { ...options.headers, ...headers } });
    searchAfter = res.headers.get('Cmr-Search-After');
    hits = parseInt(res.headers.get('Cmr-Hits'), 10);
    const data = await res.json();
    entries.push(...(data.feed?.entry || []));
  } while (searchAfter || hits > entries.length);

  return { entries, hits };
}

/**
 * Build a CMR granules search URL.
 * @param {string} baseUrl - CMR base URL (e.g. from features.cmr.url)
 * @param {object} params - Query parameters
 */
export function buildGranulesUrl(baseUrl, params = {}) {
  const getTemporal = () => {
    if (params.startDate && params.endDate) {
      return `${params.startDate},${params.endDate}`;
    }
    if (params.temporal) {
      return params.temporal;
    }
    return undefined;
  };
  const queryParams = {
    bounding_box: params.bbox,
    collection_concept_id: params.conceptId,
    shortName: params.shortName,
    day_night_flag: params.dayNight,
    temporal: getTemporal(),
    pageSize: params.pageSize,
    sort_key: params.sortKey,
    page_num: params.pageNum,
  };
  const queryString = util.toQueryString(queryParams);
  return `${baseUrl}granules.json${queryString}`;
}

/**
 * Build a CMR collections search URL.
 * @param {string} baseUrl - CMR base URL
 * @param {string} conceptId - Collection concept ID
 */
export function buildCollectionsUrl(baseUrl, conceptId) {
  const params = { concept_id: conceptId };
  return `${baseUrl}collections.json${util.toQueryString(params)}`;
}

/**
 * Build a CMR concept URL.
 * @param {string} baseUrl - CMR base URL
 * @param {string} conceptId - Concept ID
 */
export function buildConceptUrl(baseUrl, conceptId) {
  return `${baseUrl}concepts/${conceptId}`;
}
