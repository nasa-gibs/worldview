import { assign as lodashAssign } from 'lodash';

export function requestResponse(props = {}) {
  return lodashAssign(
    {},
    {
      isLoading: false,
      error: null,
      response: null,
      type: null
    },
    props
  );
}

export function requestReducer(actionName, state, action, callback) {
  const START = `${actionName}_START`;
  const SUCCESS = `${actionName}_SUCCESS`;
  const FAILURE = `${actionName}_FAILURE`;
  switch (action.type) {
    case START:
      return requestResponse({
        response: state.response,
        isLoading: true
      });
    case SUCCESS:
      return requestResponse({
        response: action.response,
        isLoading: false
      });
    case FAILURE:
      return requestResponse({
        error: action.error,
        isLoading: false
      });
    default:
      return state;
  }
}
