import {
  selectCollection,
  fetchAvailableTools,
  validateLayersConceptIds,
} from './actions';
import {
  SELECT_COLLECTION,
  SET_AVAILABLE_TOOLS,
  SET_VALID_LAYERS_CONCEPTIDS,
} from './constants';
import { getCollectionsUrl, getConceptUrl } from './selectors';
import { cmrFetch } from '../../util/cmr';

jest.mock('./selectors');
jest.mock('../../util/cmr');

describe('selectCollection', () => {
  it('returns the correct action object', () => {
    const result = selectCollection('C1234-PODAAC', 'layer-1');
    expect(result).toEqual({
      type: SELECT_COLLECTION,
      conceptId: 'C1234-PODAAC',
      layerId: 'layer-1',
    });
  });

  it('handles undefined arguments', () => {
    const result = selectCollection(undefined, undefined);
    expect(result).toEqual({
      type: SELECT_COLLECTION,
      conceptId: undefined,
      layerId: undefined,
    });
  });
});

describe('fetchAvailableTools', () => {
  let dispatch;
  let getState;

  beforeEach(() => {
    dispatch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('dispatches SET_AVAILABLE_TOOLS with tools on success', async () => {
    const mockState = {
      config: {
        features: {
          smartHandoffs: [
            { conceptId: 'T1000', toolName: 'ToolA' },
            { conceptId: 'T2000', toolName: 'ToolB' },
          ],
        },
      },
    };
    getState = jest.fn().mockReturnValue(mockState);

    getConceptUrl.mockImplementation(() => (conceptId) => `https://cmr.nasa.gov/concept/${conceptId}`);

    cmrFetch
      .mockResolvedValueOnce({ json: async () => ({ PotentialAction: { actionA: true } }) })
      .mockResolvedValueOnce({ json: async () => ({ PotentialAction: { actionB: false } }) });

    await fetchAvailableTools()(dispatch, getState);

    expect(dispatch).toHaveBeenCalledWith({
      type: SET_AVAILABLE_TOOLS,
      availableTools: [
        { name: 'ToolA', action: { actionA: true } },
        { name: 'ToolB', action: { actionB: false } },
      ],
      requestFailed: false,
    });
  });

  it('dispatches SET_AVAILABLE_TOOLS with empty tools and requestFailed true on error', async () => {
    const mockState = {
      config: {
        features: {
          smartHandoffs: [{ conceptId: 'T1000', toolName: 'ToolA' }],
        },
      },
    };
    getState = jest.fn().mockReturnValue(mockState);
    getConceptUrl.mockImplementation(() => () => 'https://cmr.nasa.gov/concept/T1000');
    cmrFetch.mockRejectedValueOnce(new Error('Network failure'));

    await fetchAvailableTools()(dispatch, getState);

    expect(console.error).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({
      type: SET_AVAILABLE_TOOLS,
      availableTools: [],
      requestFailed: true,
    });
  });

  it('dispatches SET_AVAILABLE_TOOLS with empty arrays when smartHandoffs is empty', async () => {
    const mockState = {
      config: {
        features: {
          smartHandoffs: [],
        },
      },
    };
    getState = jest.fn().mockReturnValue(mockState);
    getConceptUrl.mockImplementation(() => () => '');

    await fetchAvailableTools()(dispatch, getState);

    expect(dispatch).toHaveBeenCalledWith({
      type: SET_AVAILABLE_TOOLS,
      availableTools: [],
      requestFailed: false,
    });
  });
});

describe('validateLayersConceptIds', () => {
  let dispatch;
  let getState;

  beforeEach(() => {
    dispatch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('dispatches SET_VALID_LAYERS_CONCEPTIDS with valid layers on success', async () => {
    const mockState = {
      smartHandoffs: {
        validatedConceptIds: {},
      },
    };
    getState = jest.fn().mockReturnValue(mockState);

    const layers = [
      { id: 'layer-1', conceptIds: [{ value: 'C1000' }, { value: 'C2000' }] },
    ];

    getCollectionsUrl.mockImplementation(() => (id) => `https://cmr.nasa.gov/collections/${id}`);

    cmrFetch
      .mockResolvedValueOnce({ json: async () => ({ feed: { entry: [{ id: 'C1000' }] } }) })
      .mockResolvedValueOnce({ json: async () => ({ feed: { entry: [] } }) });

    await validateLayersConceptIds(layers)(dispatch, getState);

    expect(dispatch).toHaveBeenCalledWith({
      type: SET_VALID_LAYERS_CONCEPTIDS,
      validatedLayers: [layers[0]],
      validatedConceptIds: { C1000: true, C2000: false },
      requestFailed: false,
    });
  });

  it('skips fetching for already validated concept IDs', async () => {
    const mockState = {
      smartHandoffs: {
        validatedConceptIds: { C1000: true },
      },
    };
    getState = jest.fn().mockReturnValue(mockState);

    const layers = [
      { id: 'layer-1', conceptIds: [{ value: 'C1000' }] },
    ];

    getCollectionsUrl.mockImplementation(() => (id) => `https://cmr.nasa.gov/collections/${id}`);

    await validateLayersConceptIds(layers)(dispatch, getState);

    expect(cmrFetch).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({
      type: SET_VALID_LAYERS_CONCEPTIDS,
      validatedLayers: [layers[0]],
      validatedConceptIds: { C1000: true },
      requestFailed: false,
    });
  });

  it('excludes layers with no valid concept IDs', async () => {
    const mockState = {
      smartHandoffs: {
        validatedConceptIds: {},
      },
    };
    getState = jest.fn().mockReturnValue(mockState);

    const layers = [
      { id: 'layer-1', conceptIds: [{ value: 'C9999' }] },
    ];

    getCollectionsUrl.mockImplementation(() => (id) => `https://cmr.nasa.gov/collections/${id}`);
    cmrFetch.mockResolvedValueOnce({ json: async () => ({ feed: { entry: [] } }) });

    await validateLayersConceptIds(layers)(dispatch, getState);

    expect(dispatch).toHaveBeenCalledWith({
      type: SET_VALID_LAYERS_CONCEPTIDS,
      validatedLayers: [],
      validatedConceptIds: { C9999: false },
      requestFailed: false,
    });
  });

  it('handles layers with no conceptIds array', async () => {
    const mockState = {
      smartHandoffs: {
        validatedConceptIds: {},
      },
    };
    getState = jest.fn().mockReturnValue(mockState);

    const layers = [{ id: 'layer-no-ids' }];

    getCollectionsUrl.mockImplementation(() => (id) => `https://cmr.nasa.gov/collections/${id}`);

    await validateLayersConceptIds(layers)(dispatch, getState);

    expect(cmrFetch).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({
      type: SET_VALID_LAYERS_CONCEPTIDS,
      validatedLayers: [],
      validatedConceptIds: {},
      requestFailed: false,
    });
  });

  it('handles layers with conceptIds containing falsy values', async () => {
    const mockState = {
      smartHandoffs: {
        validatedConceptIds: {},
      },
    };
    getState = jest.fn().mockReturnValue(mockState);

    const layers = [{ id: 'layer-1', conceptIds: [{ value: null }, { value: '' }] }];

    getCollectionsUrl.mockImplementation(() => (id) => `https://cmr.nasa.gov/collections/${id}`);

    await validateLayersConceptIds(layers)(dispatch, getState);

    expect(cmrFetch).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({
      type: SET_VALID_LAYERS_CONCEPTIDS,
      validatedLayers: [],
      validatedConceptIds: {},
      requestFailed: false,
    });
  });

  it('dispatches SET_VALID_LAYERS_CONCEPTIDS with requestFailed true on error', async () => {
    const mockState = {
      smartHandoffs: {
        validatedConceptIds: {},
      },
    };
    getState = jest.fn().mockReturnValue(mockState);

    const layers = [{ id: 'layer-1', conceptIds: [{ value: 'C1000' }] }];

    getCollectionsUrl.mockImplementation(() => () => 'https://cmr.nasa.gov/collections/C1000');
    cmrFetch.mockRejectedValueOnce(new Error('Fetch error'));

    await validateLayersConceptIds(layers)(dispatch, getState);

    expect(console.error).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({
      type: SET_VALID_LAYERS_CONCEPTIDS,
      validatedLayers: [],
      validatedConceptIds: {},
      requestFailed: true,
    });
  });

  it('handles feed.entry missing from response gracefully', async () => {
    const mockState = {
      smartHandoffs: {
        validatedConceptIds: {},
      },
    };
    getState = jest.fn().mockReturnValue(mockState);

    const layers = [{ id: 'layer-1', conceptIds: [{ value: 'C3000' }] }];

    getCollectionsUrl.mockImplementation(() => (id) => `https://cmr.nasa.gov/collections/${id}`);
    cmrFetch.mockResolvedValueOnce({ json: async () => ({}) });

    await validateLayersConceptIds(layers)(dispatch, getState);

    expect(dispatch).toHaveBeenCalledWith({
      type: SET_VALID_LAYERS_CONCEPTIDS,
      validatedLayers: [],
      validatedConceptIds: { C3000: false },
      requestFailed: false,
    });
  });
});
