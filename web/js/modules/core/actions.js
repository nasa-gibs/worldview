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

export function fetchFailure(actionName, error, id) {
  return {
    type: `${actionName}_FAILURE`,
    error,
    ...!!id && { id },
  };
}

export async function requestAction(
  dispatch,
  actionName,
  url,
  mimeType,
  id,
  options,
) {
  dispatch(startRequest(actionName, id));
  try {
    const response = await fetch(url, options);
    const data = mimeType === 'application/json'
      ? await response.json()
      : await response.text();
    dispatch(fetchSuccess(actionName, data, id));
    return data;
  } catch (error) {
    dispatch(fetchFailure(actionName, error, id));
    console.error(error);
  }
}
