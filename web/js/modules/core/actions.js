export function requestAction(
  dispatch,
  actionName,
  url,
  mimeType,
  id,
  signal,
  TIMEOUT_AMOUNT,
) {
  // let didTimeOut = false;
  dispatch(startRequest(actionName, id));
  return new Promise((resolve, reject) =>
    // const timeout = setTimeout(function() {
    //   didTimeOut = true;
    //   dispatch(fetchTimeout(actionName, id));
    // }, TIMEOUT_AMOUNT);
    fetch(url, { signal })
      .then((response) =>
        // clearTimeout(timeout);
        //  if (!didTimeOut) {
        (mimeType === 'application/json'
          ? response.json()
          : response.text()),
        // }
      )
      .then((data) => {
        // if (!didTimeOut) {
        dispatch(fetchSuccess(actionName, data, id));
        resolve(data);
        // }
      })
      .catch((error) => {
        // if (didTimeOut) return;
        // clearTimeout(timeout);
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
  return {
    type: `${actionName}_SUCCESS`,
    response,
    ...!!id && { id },
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
    error,
    ...!!id && { id },
  };
}
