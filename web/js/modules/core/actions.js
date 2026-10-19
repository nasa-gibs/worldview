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
  options = {},
) {
  const opts = options || {};

  dispatch(startRequest(actionName, id));
  try {
    const response = await fetch(url, opts);

    let data;
    if (mimeType === 'application/json') {
      if (opts.parser) {
        const rawText = await response.text();
        data = opts.parser(rawText);
      } else {
        if (typeof response.json === 'function') {
          data = await response.json();
        } else {
          const rawText = await response.text();
          data = rawText ? JSON.parse(rawText) : null;
        }
      }
    } else {
      data = await response.text();
    }

    dispatch(fetchSuccess(actionName, data, id));
    return data;
  } catch (error) {
    dispatch(fetchFailure(actionName, error, id));
    return console.error(error);
  }
}
