import {
  SELECT_COLLECTION,
  SET_AVAILABLE_TOOLS,
  SET_VALID_LAYERS_CONCEPTIDS,
} from './constants';

export const initialState = {
  conceptId: null,
  layerId: null,
  availableTools: [],
  validatedLayers: [],
  validatedConceptIds: {},
  isLoadingTools: true,
  isValidatingCollections: true,
  requestFailed: false,
};

export function getInitialState(config) {
  return {
    ...initialState,
    configuredTools: config.features.smartHandoffs,
  };
}

export function smartHandoffReducer(state = initialState, action) {
  switch (action.type) {
    case SELECT_COLLECTION:
      return {
        ...state,
        conceptId: action.conceptId,
        layerId: action.layerId,
      };
    case SET_AVAILABLE_TOOLS:
      return {
        ...state,
        availableTools: action.availableTools,
        isLoadingTools: false,
        requestFailed: action.requestFailed,
      };
    case SET_VALID_LAYERS_CONCEPTIDS:
      return {
        ...state,
        validatedLayers: action.validatedLayers,
        validatedConceptIds: action.validatedConceptIds,
        isValidatingCollections: false,
        requestFailed: action.requestFailed,
      };
    default:
      return state;
  }
}
