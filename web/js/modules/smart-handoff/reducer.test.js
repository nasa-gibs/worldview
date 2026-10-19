import {
  smartHandoffReducer,
  initialState,
  getInitialState,
} from './reducer';
import {
  SELECT_COLLECTION,
  SET_AVAILABLE_TOOLS,
  SET_VALID_LAYERS_CONCEPTIDS,
} from './constants';

describe('initialState', () => {
  it('has the correct default shape', () => {
    expect(initialState).toEqual({
      conceptId: null,
      layerId: null,
      availableTools: [],
      validatedLayers: [],
      validatedConceptIds: {},
      isLoadingTools: true,
      isValidatingCollections: true,
      requestFailed: false,
    });
  });
});

describe('getInitialState', () => {
  it('merges initialState with configuredTools from config', () => {
    const config = {
      features: {
        smartHandoffs: [{ conceptId: 'T1000', toolName: 'ToolA' }],
      },
    };
    const result = getInitialState(config);
    expect(result).toEqual({
      ...initialState,
      configuredTools: config.features.smartHandoffs,
    });
  });

  it('sets configuredTools to an empty array when smartHandoffs is empty', () => {
    const config = { features: { smartHandoffs: [] } };
    const result = getInitialState(config);
    expect(result.configuredTools).toEqual([]);
  });
});

describe('smartHandoffReducer', () => {
  it('returns initialState when called with no arguments', () => {
    const result = smartHandoffReducer(undefined, {});
    expect(result).toEqual(initialState);
  });

  it('returns current state for an unknown action type', () => {
    const state = { ...initialState, conceptId: 'C9999' };
    const result = smartHandoffReducer(state, { type: 'UNKNOWN_ACTION' });
    expect(result).toBe(state);
  });

  describe('SELECT_COLLECTION', () => {
    it('sets conceptId and layerId from the action', () => {
      const action = {
        type: SELECT_COLLECTION,
        conceptId: 'C1234-PODAAC',
        layerId: 'layer-abc',
      };
      const result = smartHandoffReducer(initialState, action);
      expect(result.conceptId).toBe('C1234-PODAAC');
      expect(result.layerId).toBe('layer-abc');
    });

    it('preserves the rest of the state', () => {
      const action = {
        type: SELECT_COLLECTION,
        conceptId: 'C1234-PODAAC',
        layerId: 'layer-abc',
      };
      const result = smartHandoffReducer(initialState, action);
      expect(result.availableTools).toEqual(initialState.availableTools);
      expect(result.validatedLayers).toEqual(initialState.validatedLayers);
      expect(result.isLoadingTools).toBe(initialState.isLoadingTools);
      expect(result.isValidatingCollections).toBe(initialState.isValidatingCollections);
      expect(result.requestFailed).toBe(initialState.requestFailed);
    });

    it('overwrites a previously set conceptId and layerId', () => {
      const stateWithSelection = {
        ...initialState,
        conceptId: 'C0000',
        layerId: 'old-layer',
      };
      const action = {
        type: SELECT_COLLECTION,
        conceptId: 'C9999',
        layerId: 'new-layer',
      };
      const result = smartHandoffReducer(stateWithSelection, action);
      expect(result.conceptId).toBe('C9999');
      expect(result.layerId).toBe('new-layer');
    });
  });

  describe('SET_AVAILABLE_TOOLS', () => {
    it('sets availableTools, sets isLoadingTools to false, and sets requestFailed', () => {
      const tools = [{ name: 'ToolA', action: {} }];
      const action = {
        type: SET_AVAILABLE_TOOLS,
        availableTools: tools,
        requestFailed: false,
      };
      const result = smartHandoffReducer(initialState, action);
      expect(result.availableTools).toEqual(tools);
      expect(result.isLoadingTools).toBe(false);
      expect(result.requestFailed).toBe(false);
    });

    it('sets requestFailed to true when the request failed', () => {
      const action = {
        type: SET_AVAILABLE_TOOLS,
        availableTools: [],
        requestFailed: true,
      };
      const result = smartHandoffReducer(initialState, action);
      expect(result.requestFailed).toBe(true);
      expect(result.isLoadingTools).toBe(false);
      expect(result.availableTools).toEqual([]);
    });

    it('preserves the rest of the state', () => {
      const action = {
        type: SET_AVAILABLE_TOOLS,
        availableTools: [],
        requestFailed: false,
      };
      const result = smartHandoffReducer(initialState, action);
      expect(result.conceptId).toBe(initialState.conceptId);
      expect(result.layerId).toBe(initialState.layerId);
      expect(result.validatedLayers).toEqual(initialState.validatedLayers);
      expect(result.isValidatingCollections).toBe(initialState.isValidatingCollections);
    });
  });

  describe('SET_VALID_LAYERS_CONCEPTIDS', () => {
    it('sets validatedLayers, validatedConceptIds, sets isValidatingCollections to false, and sets requestFailed', () => {
      const validatedLayers = [{ id: 'layer-1' }];
      const validatedConceptIds = { C1000: true, C2000: false };
      const action = {
        type: SET_VALID_LAYERS_CONCEPTIDS,
        validatedLayers,
        validatedConceptIds,
        requestFailed: false,
      };
      const result = smartHandoffReducer(initialState, action);
      expect(result.validatedLayers).toEqual(validatedLayers);
      expect(result.validatedConceptIds).toEqual(validatedConceptIds);
      expect(result.isValidatingCollections).toBe(false);
      expect(result.requestFailed).toBe(false);
    });

    it('sets requestFailed to true when the request failed', () => {
      const action = {
        type: SET_VALID_LAYERS_CONCEPTIDS,
        validatedLayers: [],
        validatedConceptIds: {},
        requestFailed: true,
      };
      const result = smartHandoffReducer(initialState, action);
      expect(result.requestFailed).toBe(true);
      expect(result.isValidatingCollections).toBe(false);
    });

    it('preserves the rest of the state', () => {
      const action = {
        type: SET_VALID_LAYERS_CONCEPTIDS,
        validatedLayers: [],
        validatedConceptIds: {},
        requestFailed: false,
      };
      const result = smartHandoffReducer(initialState, action);
      expect(result.conceptId).toBe(initialState.conceptId);
      expect(result.layerId).toBe(initialState.layerId);
      expect(result.availableTools).toEqual(initialState.availableTools);
      expect(result.isLoadingTools).toBe(initialState.isLoadingTools);
    });
  });
});
