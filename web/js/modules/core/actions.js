export function requestAction(dispatch, actionName, url, mimeType, id, signal) {
  dispatch(startRequest(actionName, id));
  return new Promise(function(resolve, reject) {
    return fetch(url, { signal })
      .then(function(response) {
        return mimeType === 'application/json'
          ? response.json()
          : response.text();
      })
      .then(function(data) {
        dispatch(fetchSuccess(actionName, data, id));
        resolve(data);
      })
      .catch(function(error) {
        dispatch(fetchFailure(actionName, error, id));
        reject(error);
      });
  });
}
export function startRequest(actionName, id) {
  return {
    type: `${actionName}_START`,
    id: id
  };
}

export function fetchSuccess(actionName, response, id) {
  return {
    type: `${actionName}_SUCCESS`,
    response: response,
    id: id
  };
}

export function fetchFailure(actionName, error, id) {
  return {
    type: `${actionName}_FAILURE`,
    error: error,
    id: id
  };
}
