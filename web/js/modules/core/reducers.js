import { assign as lodashAssign } from 'lodash';

export const defaultRequestState = {
  isLoading: false,
  error: null,
  response: null,
  type: null,
};
export function requestResponse(props = {}) {
  return lodashAssign({}, defaultRequestState, props);
}
export function requestReducer(actionName, state, action) {
  const START = `${actionName}_START`;
  const SUCCESS = `${actionName}_SUCCESS`;
  const FAILURE = `${actionName}_FAILURE`;
  switch (action.type) {
    case START:
      return requestResponse({
        isLoading: true,
        response: null,
      });
    case SUCCESS:
      return requestResponse({
        response: action.response,
        isLoading: false,
      });
    case FAILURE:
      return requestResponse({
        response: null,
        error: action.error,
        isLoading: false,
      });
    default:
      return requestResponse(state);
  }
}
