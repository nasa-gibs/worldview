export function requestAction(
  dispatch,
  actionName,
  url,
  mimeType,
  id,
  options,
  state,
) {
  dispatch(startRequest(actionName, id));
  return new Promise((resolve, reject) => fetch(url, options)
    .then((response) => (mimeType === 'application/json'
      ? response.json()
      : response.text()
    ))
    .then((data) => {
      dispatch(fetchSuccess(actionName, data, id, state));
      resolve(data);
    })
    .catch((error) => {
      dispatch(fetchFailure(actionName, error, id));
      reject(error);
    }));
}

export function startRequest(actionName, id) {
  return {
    type: `${actionName}_START`,
    ...!!id && { id },
  };
}

export function fetchSuccess(actionName, response, id) {
  return (dispatch, getState) => {
    const state = getState();
    const action = {
      type: `${actionName}_SUCCESS`,
      response,
      ...!!id && { id },
    };
    if (state) action.state = state;
    dispatch(action);
  };
}

export function fetchFailure(actionName, error, id) {
  return {
    type: `${actionName}_FAILURE`,
    error,
    ...!!id && { id },
  };
}
