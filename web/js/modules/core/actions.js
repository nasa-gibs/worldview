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
  return new Promise((resolve, reject) => fetch(url, { signal })
    .then((response) => (mimeType === 'application/json'
      ? response.json()
      : response.text()
    ))
    .then((data) => {
      dispatch(fetchSuccess(actionName, data, id));
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
