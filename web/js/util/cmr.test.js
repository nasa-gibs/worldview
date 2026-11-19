import {
  cmrFetch,
  cmrSearchAfterFetch,
  buildGranulesUrl,
  buildCollectionsUrl,
  buildConceptUrl,
  CMR_CLIENT_ID,
} from './cmr';

beforeEach(() => {
  fetch.resetMocks();
  fetch.mockResponse(JSON.stringify({ feed: { entry: [] } }), {
    headers: { 'Cmr-Hits': '0' },
  });
});

describe('cmrFetch', () => {
  test('includes Client-Id header', async () => {
    await cmrFetch('https://cmr.earthdata.nasa.gov/search/granules.json');
    expect(fetch).toHaveBeenCalledTimes(1);
    const [, options] = fetch.mock.calls[0];
    expect(options.headers['Client-Id']).toBe(CMR_CLIENT_ID);
  });

  test('merges additional headers', async () => {
    await cmrFetch('https://cmr.earthdata.nasa.gov/search/granules.json', {
      headers: { 'Cmr-Search-After': 'abc123' },
    });
    const [, options] = fetch.mock.calls[0];
    expect(options.headers['Client-Id']).toBe(CMR_CLIENT_ID);
    expect(options.headers['Cmr-Search-After']).toBe('abc123');
  });

  test('passes through cache option', async () => {
    await cmrFetch('https://cmr.earthdata.nasa.gov/search/granules.json', {
      cache: 'force-cache',
    });
    const [, options] = fetch.mock.calls[0];
    expect(options.cache).toBe('force-cache');
  });

  test('returns the Response object', async () => {
    const response = await cmrFetch('https://cmr.earthdata.nasa.gov/search/granules.json');
    expect(response).toBeDefined();
    const data = await response.json();
    expect(data.feed.entry).toEqual([]);
  });
});

describe('cmrSearchAfterFetch', () => {
  test('returns entries from single page', async () => {
    const entries = [{ id: '1', time_start: '2024-01-01' }];
    fetch.mockResponseOnce(JSON.stringify({ feed: { entry: entries } }), {
      headers: { 'Cmr-Hits': '1' },
    });

    const result = await cmrSearchAfterFetch('https://cmr.earthdata.nasa.gov/search/granules.json');
    expect(result.entries).toEqual(entries);
    expect(result.hits).toBe(1);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('paginates using Cmr-Search-After header', async () => {
    const page1 = [{ id: '1' }, { id: '2' }];
    const page2 = [{ id: '3' }];

    fetch.mockResponseOnce(JSON.stringify({ feed: { entry: page1 } }), {
      headers: { 'Cmr-Hits': '3', 'Cmr-Search-After': 'token123' },
    });
    fetch.mockResponseOnce(JSON.stringify({ feed: { entry: page2 } }), {
      headers: { 'Cmr-Hits': '3' },
    });

    const result = await cmrSearchAfterFetch('https://cmr.earthdata.nasa.gov/search/granules.json');
    expect(result.entries).toEqual([...page1, ...page2]);
    expect(result.hits).toBe(3);
    expect(fetch).toHaveBeenCalledTimes(2);

    const [, secondCallOptions] = fetch.mock.calls[1];
    expect(secondCallOptions.headers['Cmr-Search-After']).toBe('token123');
  });

  test('terminates when no more entries', async () => {
    fetch.mockResponseOnce(JSON.stringify({ feed: { entry: [] } }), {
      headers: { 'Cmr-Hits': '0' },
    });

    const result = await cmrSearchAfterFetch('https://cmr.earthdata.nasa.gov/search/granules.json');
    expect(result.entries).toEqual([]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe('buildGranulesUrl', () => {
  const baseUrl = 'https://cmr.earthdata.nasa.gov/search/';

  test('builds URL with conceptId and pageSize', () => {
    const url = buildGranulesUrl(baseUrl, {
      conceptId: 'C123-PROVIDER',
      pageSize: 500,
    });
    expect(url).toContain('granules.json');
    expect(url).toContain('collection_concept_id=C123-PROVIDER');
    expect(url).toContain('pageSize=500');
  });

  test('builds URL with temporal from startDate and endDate', () => {
    const url = buildGranulesUrl(baseUrl, {
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2024-01-02T00:00:00Z',
    });
    expect(url).toContain('temporal=2024-01-01T00%3A00%3A00Z%2C2024-01-02T00%3A00%3A00Z');
  });

  test('builds URL with raw temporal param', () => {
    const url = buildGranulesUrl(baseUrl, {
      temporal: 'P0Y0M0DT0H0M/2024-01-01T00:00:00Z',
    });
    expect(url).toContain('temporal=P0Y0M0DT0H0M');
  });

  test('builds URL with bbox', () => {
    const url = buildGranulesUrl(baseUrl, {
      bbox: '-180,-90,180,90',
    });
    expect(url).toContain('bounding_box=-180%2C-90%2C180%2C90');
  });

  test('builds URL with sortKey and pageNum', () => {
    const url = buildGranulesUrl(baseUrl, {
      sortKey: '-start_date',
      pageNum: 2,
    });
    expect(url).toContain('sort_key=-start_date');
    expect(url).toContain('page_num=2');
  });

  test('omits undefined params', () => {
    const url = buildGranulesUrl(baseUrl, { pageSize: 100 });
    expect(url).not.toContain('bounding_box');
    expect(url).not.toContain('shortName');
    expect(url).not.toContain('temporal');
  });
});

describe('buildCollectionsUrl', () => {
  test('builds collections URL with concept_id', () => {
    const url = buildCollectionsUrl('https://cmr.earthdata.nasa.gov/search/', 'C123-PROVIDER');
    expect(url).toBe('https://cmr.earthdata.nasa.gov/search/collections.json?concept_id=C123-PROVIDER');
  });
});

describe('buildConceptUrl', () => {
  test('builds concept URL', () => {
    const url = buildConceptUrl('https://cmr.earthdata.nasa.gov/search/', 'C123-PROVIDER');
    expect(url).toBe('https://cmr.earthdata.nasa.gov/search/concepts/C123-PROVIDER');
  });
});
