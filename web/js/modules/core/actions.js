import { fetch } from 'whatwg-fetch';

export function requestAction(dispatch, actionName, url, fileType, signal) {
  dispatch(startRequest(actionName));
  return new Promise(function(resolve, reject) {
    return fetch(url, { signal })
      .then(function(response) {
        return fileType === 'json' ? response.json() : response.text();
      })
      .then(function(data) {
        dispatch(fetchSuccess(actionName, data));
        resolve(data);
      })
      .catch(function(err) {
        dispatch(fetchFailure(actionName, err));
        reject(err);
      });
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
