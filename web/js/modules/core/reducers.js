import { assign as lodashAssign } from 'lodash';

export const defaultRequestState = {
  isLoading: false,
  error: null,
  response: null,
  type: null
};
export function requestResponse(props = {}) {
  return lodashAssign({}, defaultRequestState, props);
}
export function requestReducer(actionName, state, action, callback) {
  const START = `${actionName}_START`;
  const SUCCESS = `${actionName}_SUCCESS`;
  const FAILURE = `${actionName}_FAILURE`;
  switch (action.type) {
    case START:
      return requestResponse({
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
      return requestResponse({});
  }
}
