// Local replacement for the unmaintained `redux-location-state` package.

const LOCATION_POP_ACTION = 'REDUX-LOCATION-POP-ACTION';

function omitOverlayGroups(value) {
  if (!value || typeof value !== 'object') return value;
  if (!Object.prototype.hasOwnProperty.call(value, 'overlayGroups')) return value;
  return Object.entries(value).reduce((acc, [key, entryValue]) => {
    if (key !== 'overlayGroups') acc[key] = entryValue;
    return acc;
  }, {});
}

function isPlainObject(value) {
  if (!value || typeof value !== 'object') return false;
  return Object.prototype.toString.call(value) === '[object Object]';
}

function mergeDeep(baseValue, patchValue) {
  if (typeof patchValue === 'undefined') return baseValue;
  if (Array.isArray(patchValue)) return patchValue;
  if (isPlainObject(baseValue) && isPlainObject(patchValue)) {
    const merged = { ...baseValue };
    Object.keys(patchValue).forEach((key) => {
      merged[key] = mergeDeep(baseValue[key], patchValue[key]);
    });
    return merged;
  }
  // Dates, class instances, functions, etc: replace.
  return patchValue;
}

function safeDecode(value) {
  if (typeof value !== 'string') return value;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseSearch(search) {
  if (!search) return {};
  const queryString = search[0] === '?' ? search.slice(1) : search;
  if (!queryString) return {};

  return queryString.split('&').reduce((acc, part) => {
    if (!part) return acc;
    const equalsIndex = part.indexOf('=');
    if (equalsIndex === -1) {
      acc[safeDecode(part)] = '';
      return acc;
    }
    const key = safeDecode(part.slice(0, equalsIndex));
    const value = safeDecode(part.slice(equalsIndex + 1));
    acc[key] = value;
    return acc;
  }, {});
}

function setAtPath(target, path, value) {
  if (!path) return;
  const parts = path.split('.');
  let node = target;
  for (let i = 0; i < parts.length; i += 1) {
    const key = parts[i];
    if (i === parts.length - 1) {
      node[key] = value;
    } else {
      node[key] = node[key] && typeof node[key] === 'object' ? node[key] : {};
      node = node[key];
    }
  }
}

function getPathConfig(paramSetup, location) {
  // The historical `redux-location-state` helper supports path-specific configs.
  // Worldview currently only uses the `global` config, so prefer it.
  if (paramSetup && typeof paramSetup === 'object') {
    if (paramSetup.global && typeof paramSetup.global === 'object') return paramSetup.global;
  }
  return null;
}

function parseByType(type, rawValue) {
  if (typeof rawValue !== 'string') return rawValue;
  switch (type) {
    case 'bool':
      return rawValue === 'true';
    case 'number': {
      const num = Number(rawValue);
      return Number.isNaN(num) ? undefined : num;
    }
    case 'array':
      return rawValue ? rawValue.split(',').filter((v) => v !== '') : [];
    case 'object':
      try {
        return rawValue ? JSON.parse(rawValue) : {};
      } catch {
        return {};
      }
    case 'date': {
      const dt = new Date(rawValue);
      return Number.isNaN(dt.valueOf()) ? undefined : dt;
    }
    default:
      return rawValue;
  }
}

function parseQuery(paramSetup, location) {
  const pathConfig = getPathConfig(paramSetup, location);
  if (!pathConfig) return {};

  const params = parseSearch(location?.search);

  const stateFromLocation = {};
  Object.keys(params).forEach((paramName) => {
    const definition = pathConfig[paramName];
    if (!definition) return;

    const { stateKey, options = {}, type } = definition;
    if (!stateKey) return;

    const rawValue = params[paramName];

    let parsedValue;
    if (typeof options.parse === 'function') {
      parsedValue = options.parse(rawValue);
    } else if (type) {
      parsedValue = parseByType(type, rawValue);
    } else {
      parsedValue = rawValue;
    }

    // Preserve explicit empty items when requested; otherwise drop undefineds.
    if (typeof parsedValue === 'undefined' && !options.setAsEmptyItem) return;

    setAtPath(stateFromLocation, stateKey, parsedValue);
  });

  return stateFromLocation;
}

function locationsEqual(a, b) {
  return !!a && !!b &&
    a.pathname === b.pathname &&
    a.search === b.search &&
    a.hash === b.hash;
}

/**
 * @param {object} paramSetup Config returned by `getParamObject`
 * @param {function} mapLocationToState Maps URL-derived data to redux state on POP
 * @param {import('history').BrowserHistory} history
 * @param {function} reducers Root reducer
 * @param {function} stateToParams Maps redux state back to a `location` object
 */
export function createReduxLocationActions(
  paramSetup,
  mapLocationToState,
  history,
  reducers,
  stateToParams,
) {
  let lastLocation = history.location;

  const locationMiddleware = (store) => (next) => (action) => {
    const prevState = store.getState();
    const result = next(action);
    const nextState = store.getState();

    const currentLocation = history.location;
    const pathnameChanged = currentLocation.pathname !== lastLocation.pathname;

    if (nextState !== prevState || pathnameChanged) {
      lastLocation = currentLocation;

      const mapped = stateToParams(paramSetup, nextState, currentLocation);
      const desiredLocation = mapped?.location;
      const shouldPush = !!mapped?.shouldPush;

      if (desiredLocation && !locationsEqual(desiredLocation, currentLocation)) {
        const { pathname, hash, state } = currentLocation;
        const nextLocation = {
          pathname: desiredLocation.pathname || pathname,
          hash: desiredLocation.hash || hash,
          state,
          search: desiredLocation.search || '',
        };

        if (shouldPush && !pathnameChanged) {
          history.push(nextLocation);
        } else {
          history.replace(nextLocation);
        }
      }
    }

    return result;
  };

  const reducersWithLocation = (state, action) => {
    const reduced = reducers(state, action);
    if (action?.type !== LOCATION_POP_ACTION || !action?.payload) return reduced;

    const patchFromLocation = parseQuery(paramSetup, action.payload);
    // Seed slices that `mapLocationToState` and its helpers assume exist.
    // Avoid seeding slices that may contain non-plain objects (e.g. OL map instances).
    const activeLayers = reduced?.layers?.active;
    const activeBLayers = reduced?.layers?.activeB;
    const activeWithoutOverlayGroups = omitOverlayGroups(activeLayers);
    const activeBWithoutOverlayGroups = omitOverlayGroups(activeBLayers);
    const baseQuery = {
      date: reduced?.date,
      proj: reduced?.proj,
      // Do not seed `overlayGroups` here. `mapLocationToLayerState` computes them from
      // the active layers list; seeding an existing (truthy) value can cause it to
      // incorrectly clear groups when the URL has any query params.
      layers: reduced?.layers
        ? {
          active: activeWithoutOverlayGroups,
          activeB: activeBWithoutOverlayGroups,
        }
        : reduced?.layers,
      locationSearch: reduced?.locationSearch,
      compare: reduced?.compare,
      charting: reduced?.charting,
      palettes: reduced?.palettes,
      animation: reduced?.animation,
      sidebar: reduced?.sidebar,
      tour: reduced?.tour,
      embed: reduced?.embed,
      events: reduced?.events,
      ui: reduced?.ui,
      smartHandoffs: reduced?.smartHandoffs,
    };

    const location = {
      ...action.payload,
      query: mergeDeep(baseQuery, patchFromLocation),
    };

    return mapLocationToState(reduced, location);
  };

  return { locationMiddleware, reducersWithLocation };
}

/**
 * Listen for browser history changes and dispatch POP actions.
 */
export function listenForHistoryChange(store, history) {
  // Initialize location state on startup
  store.dispatch({ type: LOCATION_POP_ACTION, payload: history.location });

  return history.listen(({ location, action }) => {
    // Only treat real browser back/forward navigations as POP.
    // push/replace are used by the app to sync redux state -> URL and
    // should not trigger a URL->state remap.
    if (action !== 'POP') return;
    store.dispatch({ type: LOCATION_POP_ACTION, payload: location });
  });
}
