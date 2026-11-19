import {
  getBaseCmrUrl,
  getGranulesUrl,
  getCollectionsUrl,
  getConceptUrl,
  getValidLayersForHandoffs,
} from './selectors';
import { getActiveLayers, memoizedAvailable } from '../layers/selectors';
import { buildGranulesUrl, buildCollectionsUrl, buildConceptUrl } from '../../util/cmr';

jest.mock('../layers/selectors');
jest.mock('../../util/cmr');

const mockState = {
  config: {
    features: {
      cmr: {
        url: 'https://cmr.nasa.gov',
      },
    },
  },
  proj: {
    id: 'geographic',
  },
};

describe('getBaseCmrUrl', () => {
  it('returns the CMR base URL from state', () => {
    expect(getBaseCmrUrl(mockState)).toBe('https://cmr.nasa.gov');
  });
});

describe('getGranulesUrl', () => {
  it('returns a function', () => {
    const result = getGranulesUrl(mockState);
    expect(typeof result).toBe('function');
  });

  it('calls buildGranulesUrl with the base URL and provided params', () => {
    buildGranulesUrl.mockReturnValue('https://cmr.nasa.gov/granules?foo=bar');
    const getUrl = getGranulesUrl(mockState);
    const result = getUrl({ foo: 'bar' });
    expect(buildGranulesUrl).toHaveBeenCalledWith('https://cmr.nasa.gov', { foo: 'bar' });
    expect(result).toBe('https://cmr.nasa.gov/granules?foo=bar');
  });

  it('calls buildGranulesUrl with empty params by default', () => {
    buildGranulesUrl.mockReturnValue('https://cmr.nasa.gov/granules');
    const getUrl = getGranulesUrl(mockState);
    const result = getUrl();
    expect(buildGranulesUrl).toHaveBeenCalledWith('https://cmr.nasa.gov', {});
    expect(result).toBe('https://cmr.nasa.gov/granules');
  });
});

describe('getCollectionsUrl', () => {
  it('returns a function', () => {
    const result = getCollectionsUrl(mockState);
    expect(typeof result).toBe('function');
  });

  it('calls buildCollectionsUrl with the base URL and provided id', () => {
    buildCollectionsUrl.mockReturnValue('https://cmr.nasa.gov/collections/C1000');
    const getUrl = getCollectionsUrl(mockState);
    const result = getUrl('C1000');
    expect(buildCollectionsUrl).toHaveBeenCalledWith('https://cmr.nasa.gov', 'C1000');
    expect(result).toBe('https://cmr.nasa.gov/collections/C1000');
  });

  it('passes undefined id to buildCollectionsUrl when not provided', () => {
    buildCollectionsUrl.mockReturnValue('https://cmr.nasa.gov/collections/undefined');
    const getUrl = getCollectionsUrl(mockState);
    getUrl(undefined);
    expect(buildCollectionsUrl).toHaveBeenCalledWith('https://cmr.nasa.gov', undefined);
  });
});

describe('getConceptUrl', () => {
  it('returns a function', () => {
    const result = getConceptUrl(mockState);
    expect(typeof result).toBe('function');
  });

  it('calls buildConceptUrl with the base URL and provided id', () => {
    buildConceptUrl.mockReturnValue('https://cmr.nasa.gov/concepts/T1000');
    const getUrl = getConceptUrl(mockState);
    const result = getUrl('T1000');
    expect(buildConceptUrl).toHaveBeenCalledWith('https://cmr.nasa.gov', 'T1000');
    expect(result).toBe('https://cmr.nasa.gov/concepts/T1000');
  });

  it('passes undefined id to buildConceptUrl when not provided', () => {
    buildConceptUrl.mockReturnValue('https://cmr.nasa.gov/concepts/undefined');
    const getUrl = getConceptUrl(mockState);
    getUrl(undefined);
    expect(buildConceptUrl).toHaveBeenCalledWith('https://cmr.nasa.gov', undefined);
  });
});

describe('getValidLayersForHandoffs', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const makeLayer = (overrides = {}) => ({
    id: 'layer-1',
    projections: { geographic: {} },
    disableSmartHandoff: false,
    conceptIds: [{ type: 'STD', value: 'C1000', version: '1' }],
    ...overrides,
  });

  it('returns layers that are available, in projection, not disabled, and have valid conceptIds', () => {
    const layer = makeLayer();
    getActiveLayers.mockReturnValue([layer]);
    memoizedAvailable.mockReturnValue(() => true);

    const result = getValidLayersForHandoffs(mockState);
    expect(result).toEqual([layer]);
  });

  it('excludes layers that are not available', () => {
    const layer = makeLayer();
    getActiveLayers.mockReturnValue([layer]);
    memoizedAvailable.mockReturnValue(() => false);

    const result = getValidLayersForHandoffs(mockState);
    expect(result).toEqual([]);
  });

  it('excludes layers not in the current projection', () => {
    const layer = makeLayer({ projections: { arctic: {} } });
    getActiveLayers.mockReturnValue([layer]);
    memoizedAvailable.mockReturnValue(() => true);

    const result = getValidLayersForHandoffs(mockState);
    expect(result).toEqual([]);
  });

  it('excludes layers with disableSmartHandoff set to true', () => {
    const layer = makeLayer({ disableSmartHandoff: true });
    getActiveLayers.mockReturnValue([layer]);
    memoizedAvailable.mockReturnValue(() => true);

    const result = getValidLayersForHandoffs(mockState);
    expect(result).toEqual([]);
  });

  it('excludes layers with no conceptIds', () => {
    const layer = makeLayer({ conceptIds: undefined });
    getActiveLayers.mockReturnValue([layer]);
    memoizedAvailable.mockReturnValue(() => true);

    const result = getValidLayersForHandoffs(mockState);
    expect(result).toEqual([]);
  });

  it('excludes layers with an empty conceptIds array', () => {
    const layer = makeLayer({ conceptIds: [] });
    getActiveLayers.mockReturnValue([layer]);
    memoizedAvailable.mockReturnValue(() => true);

    const result = getValidLayersForHandoffs(mockState);
    expect(result).toEqual([]);
  });

  it('excludes layers where all conceptIds are missing type', () => {
    const layer = makeLayer({ conceptIds: [{ value: 'C1000', version: '1' }] });
    getActiveLayers.mockReturnValue([layer]);
    memoizedAvailable.mockReturnValue(() => true);

    const result = getValidLayersForHandoffs(mockState);
    expect(result).toEqual([]);
  });

  it('excludes layers where all conceptIds are missing value', () => {
    const layer = makeLayer({ conceptIds: [{ type: 'STD', version: '1' }] });
    getActiveLayers.mockReturnValue([layer]);
    memoizedAvailable.mockReturnValue(() => true);

    const result = getValidLayersForHandoffs(mockState);
    expect(result).toEqual([]);
  });

  it('excludes layers where all conceptIds are missing version', () => {
    const layer = makeLayer({ conceptIds: [{ type: 'STD', value: 'C1000' }] });
    getActiveLayers.mockReturnValue([layer]);
    memoizedAvailable.mockReturnValue(() => true);

    const result = getValidLayersForHandoffs(mockState);
    expect(result).toEqual([]);
  });

  it('includes a layer if at least one conceptId has all required fields', () => {
    const layer = makeLayer({
      conceptIds: [
        { type: 'STD', value: 'C1000', version: '1' },
        { value: 'C2000' },
      ],
    });
    getActiveLayers.mockReturnValue([layer]);
    memoizedAvailable.mockReturnValue(() => true);

    const result = getValidLayersForHandoffs(mockState);
    expect(result).toEqual([layer]);
  });

  it('filters multiple layers correctly', () => {
    const validLayer = makeLayer({ id: 'layer-valid' });
    const invalidLayer = makeLayer({ id: 'layer-invalid', disableSmartHandoff: true });
    getActiveLayers.mockReturnValue([validLayer, invalidLayer]);
    memoizedAvailable.mockReturnValue(() => true);

    const result = getValidLayersForHandoffs(mockState);
    expect(result).toEqual([validLayer]);
  });

  it('returns an empty array when there are no active layers', () => {
    getActiveLayers.mockReturnValue([]);
    memoizedAvailable.mockReturnValue(() => true);

    const result = getValidLayersForHandoffs(mockState);
    expect(result).toEqual([]);
  });
});
