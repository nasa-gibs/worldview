import openEarthDataSearch, {
  getStartEndDates,
  parseSmartHandoff,
  serializeSmartHandoff,
} from './util';
import { TOOLS_EARTHDATA_SEARCH } from './constants';
import googleTagManager from 'googleTagManager';
import { parseTemplate } from 'url-template';

jest.mock('googleTagManager', () => ({ pushEvent: jest.fn() }));
jest.mock('url-template', () => ({ parseTemplate: jest.fn() }));

describe('getStartEndDates', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns day-bounded dates for a non-granule layer', () => {
    const layer = { type: 'wms', id: 'layer-1' };
    const selectedDate = '2023-06-15';
    const granuleLayers = {};
    const result = getStartEndDates(layer, selectedDate, granuleLayers);
    expect(result.startDate).toBe('2023-06-15T00:00:00.000Z');
    expect(result.endDate).toBe('2023-06-15T23:59:59.999Z');
  });

  it('returns granule-bounded dates for a granule layer with dates', () => {
    const layer = { type: 'granule', id: 'layer-g' };
    const selectedDate = '2023-06-15';
    const granuleLayers = {
      'layer-g': {
        dates: ['2023-06-15T01:00:00.000Z', '2023-06-15T06:00:00.000Z', '2023-06-15T12:00:00.000Z'],
      },
    };
    const result = getStartEndDates(layer, selectedDate, granuleLayers);
    expect(result.startDate).toBe('2023-06-15T01:00:00.000Z');
    expect(result.endDate).toBe('2023-06-15T12:00:00.000Z');
  });

  it('returns day-bounded dates for a granule layer with empty granuleLayers object', () => {
    const layer = { type: 'granule', id: 'layer-g' };
    const selectedDate = '2023-06-15';
    const granuleLayers = {};
    const result = getStartEndDates(layer, selectedDate, granuleLayers);
    expect(result.startDate).toBe('2023-06-15T00:00:00.000Z');
    expect(result.endDate).toBe('2023-06-15T23:59:59.999Z');
  });

  it('formats startDate and endDate with the correct UTC time for non-granule layers', () => {
    const layer = { type: 'wms', id: 'layer-1' };
    const selectedDate = '2020-01-01';
    const granuleLayers = {};
    const result = getStartEndDates(layer, selectedDate, granuleLayers);
    expect(result.startDate).toMatch(/^2020-01-01T00:00:00\.000Z$/);
    expect(result.endDate).toMatch(/^2020-01-01T23:59:59\.999Z$/);
  });

  it('returns an object with startDate and endDate keys', () => {
    const layer = { type: 'wms', id: 'layer-1' };
    const result = getStartEndDates(layer, '2023-01-01', {});
    expect(result).toHaveProperty('startDate');
    expect(result).toHaveProperty('endDate');
  });
});

describe('parseSmartHandoff', () => {
  it('splits the state string into layerId and conceptId', () => {
    const result = parseSmartHandoff('layer-abc,C1234-PODAAC');
    expect(result).toEqual({ layerId: 'layer-abc', conceptId: 'C1234-PODAAC' });
  });

  it('handles a state string with extra commas gracefully', () => {
    const result = parseSmartHandoff('layer-abc,C1234,extra');
    expect(result.layerId).toBe('layer-abc');
    expect(result.conceptId).toBe('C1234');
  });

  it('returns undefined for both values when given an empty string', () => {
    const result = parseSmartHandoff(',');
    expect(result.layerId).toBe('');
    expect(result.conceptId).toBe('');
  });
});

describe('serializeSmartHandoff', () => {
  it('returns layerId,conceptId when activeTab is download and both ids are set', () => {
    const currentItemState = { layerId: 'layer-1', conceptId: 'C1000' };
    const state = { sidebar: { activeTab: 'download' } };
    const result = serializeSmartHandoff(currentItemState, state);
    expect(result).toBe('layer-1,C1000');
  });

  it('returns undefined when activeTab is not download', () => {
    const currentItemState = { layerId: 'layer-1', conceptId: 'C1000' };
    const state = { sidebar: { activeTab: 'layers' } };
    const result = serializeSmartHandoff(currentItemState, state);
    expect(result).toBeUndefined();
  });

  it('returns undefined when layerId is missing', () => {
    const currentItemState = { layerId: null, conceptId: 'C1000' };
    const state = { sidebar: { activeTab: 'download' } };
    const result = serializeSmartHandoff(currentItemState, state);
    expect(result).toBeUndefined();
  });

  it('returns undefined when conceptId is missing', () => {
    const currentItemState = { layerId: 'layer-1', conceptId: null };
    const state = { sidebar: { activeTab: 'download' } };
    const result = serializeSmartHandoff(currentItemState, state);
    expect(result).toBeUndefined();
  });

  it('returns undefined when both layerId and conceptId are missing', () => {
    const currentItemState = { layerId: null, conceptId: null };
    const state = { sidebar: { activeTab: 'download' } };
    const result = serializeSmartHandoff(currentItemState, state);
    expect(result).toBeUndefined();
  });

  it('returns undefined when sidebar state is missing', () => {
    const currentItemState = { layerId: 'layer-1', conceptId: 'C1000' };
    const state = {};
    const result = serializeSmartHandoff(currentItemState, state);
    expect(result).toBeUndefined();
  });
});

describe('openEarthDataSearch', () => {
  let mockExpand;
  let mockWindowOpen;

  beforeEach(() => {
    mockExpand = jest.fn().mockReturnValue('https://search.earthdata.nasa.gov/search?p=C1000');
    parseTemplate.mockReturnValue({ expand: mockExpand });
    mockWindowOpen = jest.spyOn(window, 'open').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const makeTools = (action) => [
    { name: TOOLS_EARTHDATA_SEARCH, action },
  ];

  const makeAction = (overrides = {}) => ({
    Target: { UrlTemplate: 'https://search.earthdata.nasa.gov/search{?p,q}' },
    QueryInput: [],
    ...overrides,
  });

  it('opens a new window with the expanded URL', () => {
    const tools = makeTools(makeAction());
    const options = {
      projection: 'EPSG:4326',
      conceptId: 'C1000',
      startDate: '2023-01-01T00:00:00.000Z',
      endDate: '2023-01-01T23:59:59.999Z',
      currentExtent: { southWest: '-180,-90', northEast: '180,90' },
      showBoundingBox: true,
    };
    openEarthDataSearch(tools, options);
    expect(mockWindowOpen).toHaveBeenCalledWith(
      'https://search.earthdata.nasa.gov/search?p=C1000',
      '_blank',
    );
  });

  it('pushes a googleTagManager event with the selected collection', () => {
    const tools = makeTools(makeAction());
    const options = {
      projection: 'EPSG:4326',
      conceptId: 'C1000',
      startDate: '2023-01-01T00:00:00.000Z',
      endDate: '2023-01-01T23:59:59.999Z',
      currentExtent: { southWest: '-180,-90', northEast: '180,90' },
      showBoundingBox: false,
    };
    openEarthDataSearch(tools, options);
    expect(googleTagManager.pushEvent).toHaveBeenCalledWith({
      event: 'smart_handoffs_open_eds_data_query',
      selected_collection: 'C1000',
    });
  });

  it('does nothing when no matching tool is found', () => {
    const tools = [{ name: 'other-tool', action: makeAction() }];
    const options = { conceptId: 'C1000' };
    openEarthDataSearch(tools, options);
    expect(mockWindowOpen).not.toHaveBeenCalled();
    expect(googleTagManager.pushEvent).not.toHaveBeenCalled();
  });

  it('does nothing when the matching tool has no action', () => {
    const tools = [{ name: TOOLS_EARTHDATA_SEARCH }];
    const options = { conceptId: 'C1000' };
    openEarthDataSearch(tools, options);
    expect(mockWindowOpen).not.toHaveBeenCalled();
    expect(googleTagManager.pushEvent).not.toHaveBeenCalled();
  });

  it('does nothing when tools array is empty', () => {
    openEarthDataSearch([], { conceptId: 'C1000' });
    expect(mockWindowOpen).not.toHaveBeenCalled();
    expect(googleTagManager.pushEvent).not.toHaveBeenCalled();
  });

  it('builds temporal range param from QueryInput', () => {
    const tools = makeTools(makeAction({
      QueryInput: [{ ValueType: 'temporalRange', ValueName: 'temporal' }],
    }));
    const options = {
      projection: 'EPSG:4326',
      conceptId: 'C1000',
      startDate: '2023-01-01T00:00:00.000Z',
      endDate: '2023-01-01T23:59:59.999Z',
      currentExtent: { southWest: '-180,-90', northEast: '180,90' },
      showBoundingBox: false,
    };
    openEarthDataSearch(tools, options);
    expect(mockExpand).toHaveBeenCalledWith(
      expect.objectContaining({ temporal: '2023-01-01T00:00:00.000Z,2023-01-01T23:59:59.999Z' }),
    );
  });

  it('builds bounding box param from QueryInput when showBoundingBox is true', () => {
    const tools = makeTools(makeAction({
      QueryInput: [{ ValueType: 'https://schema.org/box', ValueName: 'bounding_box' }],
    }));
    const options = {
      projection: 'EPSG:4326',
      conceptId: 'C1000',
      startDate: '2023-01-01T00:00:00.000Z',
      endDate: '2023-01-01T23:59:59.999Z',
      currentExtent: { southWest: '-180,-90', northEast: '180,90' },
      showBoundingBox: true,
    };
    openEarthDataSearch(tools, options);
    expect(mockExpand).toHaveBeenCalledWith(
      expect.objectContaining({ bounding_box: '-180,-90,180,90' }),
    );
  });

  it('sets bounding box param to undefined when showBoundingBox is false', () => {
    const tools = makeTools(makeAction({
      QueryInput: [{ ValueType: 'https://schema.org/box', ValueName: 'bounding_box' }],
    }));
    const options = {
      projection: 'EPSG:4326',
      conceptId: 'C1000',
      startDate: '2023-01-01T00:00:00.000Z',
      endDate: '2023-01-01T23:59:59.999Z',
      currentExtent: { southWest: '-180,-90', northEast: '180,90' },
      showBoundingBox: false,
    };
    openEarthDataSearch(tools, options);
    expect(mockExpand).toHaveBeenCalledWith(
      expect.objectContaining({ bounding_box: undefined }),
    );
  });

  it('builds projection param from QueryInput', () => {
    const tools = makeTools(makeAction({
      QueryInput: [{ ValueType: 'https://spatialreference.org/ref/epsg/', ValueName: 'proj' }],
    }));
    const options = {
      projection: 'EPSG:4326',
      conceptId: 'C1000',
      startDate: '2023-01-01T00:00:00.000Z',
      endDate: '2023-01-01T23:59:59.999Z',
      currentExtent: { southWest: '-180,-90', northEast: '180,90' },
      showBoundingBox: false,
    };
    openEarthDataSearch(tools, options);
    expect(mockExpand).toHaveBeenCalledWith(
      expect.objectContaining({ proj: 'EPSG:4326' }),
    );
  });

  it('builds conceptId param from QueryInput with ValueType conceptId', () => {
    const tools = makeTools(makeAction({
      QueryInput: [{ ValueType: 'conceptId', ValueName: 'p' }],
    }));
    const options = {
      projection: 'EPSG:4326',
      conceptId: 'C1000',
      startDate: '2023-01-01T00:00:00.000Z',
      endDate: '2023-01-01T23:59:59.999Z',
      currentExtent: { southWest: '-180,-90', northEast: '180,90' },
      showBoundingBox: false,
    };
    openEarthDataSearch(tools, options);
    expect(mockExpand).toHaveBeenCalledWith(
      expect.objectContaining({ p: 'C1000' }),
    );
  });

  it('builds conceptId param from QueryInput with ValueType edscTextQuery', () => {
    const tools = makeTools(makeAction({
      QueryInput: [{ ValueType: 'edscTextQuery', ValueName: 'q' }],
    }));
    const options = {
      projection: 'EPSG:4326',
      conceptId: 'C1000',
      startDate: '2023-01-01T00:00:00.000Z',
      endDate: '2023-01-01T23:59:59.999Z',
      currentExtent: { southWest: '-180,-90', northEast: '180,90' },
      showBoundingBox: false,
    };
    openEarthDataSearch(tools, options);
    expect(mockExpand).toHaveBeenCalledWith(
      expect.objectContaining({ q: 'C1000' }),
    );
  });

  it('omits temporal param when startDate and endDate are missing', () => {
    const tools = makeTools(makeAction({
      QueryInput: [{ ValueType: 'temporalRange', ValueName: 'temporal' }],
    }));
    const options = {
      projection: 'EPSG:4326',
      conceptId: 'C1000',
      startDate: undefined,
      endDate: undefined,
      currentExtent: { southWest: '-180,-90', northEast: '180,90' },
      showBoundingBox: false,
    };
    openEarthDataSearch(tools, options);
    expect(mockExpand).toHaveBeenCalledWith(
      expect.not.objectContaining({ temporal: expect.anything() }),
    );
  });

  it('logs errors for undefined option values', () => {
    const tools = makeTools(makeAction());
    const options = {
      projection: undefined,
      conceptId: 'C1000',
      startDate: '2023-01-01T00:00:00.000Z',
      endDate: '2023-01-01T23:59:59.999Z',
      currentExtent: { southWest: '-180,-90', northEast: '180,90' },
      showBoundingBox: false,
    };
    openEarthDataSearch(tools, options);
    expect(console.error).toHaveBeenCalledWith('projection is undefined.');
  });
});
