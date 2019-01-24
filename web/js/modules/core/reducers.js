import { assign as lodashAssign } from 'lodash';

export function requestResponse(props = {}) {
  return lodashAssign(
    {},
    {
      isLoading: false,
      error: {},
      response: {},
      type: null
    },
    props
  );
}

export function requestReducer(actionName, state, action) {
  const START = `${actionName}_START`;
  const SUCCESS = `${actionName}_SUCCESS`;
  const FAILURE = `${actionName}_FAILURE`;
  switch (action.type) {
    case START:
      return requestResponse({
        response: state.response,
        isLoading: true,
        type: action.type
      });
    case SUCCESS:
      return requestResponse({
        response: action.response,
        isLoading: false,
        type: action.type
      });
    case FAILURE:
      return requestResponse({
        error: action.error,
        type: action.type
      });
    default:
      return state;
  }
}
