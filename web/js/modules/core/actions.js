import { fetch } from 'whatwg-fetch';

export function requestAction(dispatch, actionName, url, fileType) {
  dispatch(startRequest(actionName));
  fetch(url)
    .then(function(response) {
      return fileType === 'json' ? response.json() : response.text();
    })
    .then(function(body) {
      dispatch(fetchSuccess(actionName, body));
    })
    .catch(function(err) {
      dispatch(fetchFailure(actionName, err));
    });
}
export function startRequest(actionName) {
  return {
    type: `${actionName}_START`
  };
}

export function fetchSuccess(actionName, response) {
  return {
    type: `${actionName}_SUCCESS`,
    response: response
  };
}

export function fetchFailure(actionName, error) {
  return {
    type: `${actionName}_FAILURE`,
    error: { error }
  };
}
