export function requestAction(
  dispatch,
  actionName,
  url,
  mimeType,
  id,
  signal,
  TIMEOUT_AMOUNT
) {
  // let didTimeOut = false;
  dispatch(startRequest(actionName, id));
  return new Promise(function(resolve, reject) {
    // const timeout = setTimeout(function() {
    //   didTimeOut = true;
    //   dispatch(fetchTimeout(actionName, id));
    // }, TIMEOUT_AMOUNT);
    return fetch(url, { signal })
      .then(function(response) {
        // clearTimeout(timeout);
        //  if (!didTimeOut) {
        return mimeType === 'application/json'
          ? response.json()
          : response.text();
        // }
      })
      .then(function(data) {
        // if (!didTimeOut) {
        dispatch(fetchSuccess(actionName, data, id));
        resolve(data);
        // }
      })
      .catch(function(error) {
        // if (didTimeOut) return;
        // clearTimeout(timeout);
        dispatch(fetchFailure(actionName, error, id));
        reject(error);
      });
  });
}
export function startRequest(actionName, id) {
  return {
    type: `${actionName}_START`,
    ...(!!id && { id })
  };
}

export function fetchSuccess(actionName, response, id) {
  return {
    type: `${actionName}_SUCCESS`,
    response: response,
    ...(!!id && { id })
  };
}
// export function fetchTimeout(actionName, error, id) {
//   return {
//     type: `${actionName}_TIMEOUT`,
//     id: id
//   };
// }
export function fetchFailure(actionName, error, id) {
  return {
    type: `${actionName}_FAILURE`,
    error: error,
    ...(!!id && { id })
  };
}
