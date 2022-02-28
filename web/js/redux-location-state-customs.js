import { each as lodashEach } from 'lodash';
import {
  get,
  createObjectFromConfig,
  isEqual,
} from 'redux-location-state/lib/helpers';
import { typeHandles } from 'redux-location-state/lib/typeHandles';
import { ENCODING_EXCEPTIONS } from './modules/link/constants';

export const LOCATION_POP_ACTION = 'REDUX-LOCATION-POP-ACTION';
function isNotDefined(value) {
  return typeof value === 'undefined' || value === null;
}
export function encode(value) {
  let encoded = encodeURIComponent(value);
  lodashEach(ENCODING_EXCEPTIONS, (exception) => {
    encoded = encoded.replace(exception.match, exception.replace);
  });
  return encoded;
}
export function createParamsString(qp) {
  const paramArray = Object.keys(qp).reduce((prev, key) => {
    const keyString = key.toString();
    const valueString = qp[key].toString();
    if (
      isNotDefined(valueString)
      || (Array.isArray(valueString) && !valueString.length)
    ) {
      return prev;
    }
    return [...prev, `${encodeURIComponent(keyString)}=${encode(valueString)}`];
  }, []);

  return paramArray.length ? `?${paramArray.join('&')}` : '';
}

export function stateToParams(initialState, currentState, location) {
  const pathConfig = createObjectFromConfig(initialState, location);
  if (!pathConfig) {
    return { location: { ...location } };
  }
  const shouldPush = false;
  // check the original config for values
  const newQueryParams = Object.keys(pathConfig).reduce((prev, curr) => {
    const {
      stateKey,
      options = {},
      initialState: initialValue,
      type,
    } = pathConfig[curr];
    let currentItemState = get(currentState, stateKey);
    let isDefault = false;
    // check if the date is the same as the one in initial value
    if (type === 'date') {
      const prevHasParams = Object.keys(prev).length > 0;
      if (initialValue && currentItemState) {
        const initialValueMS = initialValue.getTime();
        const currentItemStateMS = currentItemState.getTime();
        isDefault = !prevHasParams && initialValueMS === currentItemStateMS;
      }
    } else {
      // if an empty object, make currentItemState undefined
      if (
        currentItemState
        && typeof currentItemState === 'object'
        && !Object.keys(currentItemState).length
      ) {
        currentItemState = undefined;
      }
      // check if the item is default
      isDefault = typeof currentItemState === 'object'
        ? isEqual(initialValue, currentItemState)
        : currentItemState === initialValue;
    }
    // if it is default or doesn't exist don't make a query parameter
    if ((!currentItemState || isDefault) && !options.setAsEmptyItem) {
      return prev;
    }
    // otherwise, check if there is a serialize function
    if (options.serialize) {
      const itemState = options.serialize(
        currentItemState,
        options.serializeNeedsGlobalState ? currentState : undefined,
        options.serializeNeedsPrev ? prev : undefined,
      );
      // short circuit if specialized serializer returns specifically undefined
      if (typeof itemState === 'undefined') {
        return prev;
      }
      currentItemState = itemState;
    } else if (type) {
      currentItemState = typeHandles[type].serialize(currentItemState, options);
    }
    // add new params to reduced object
    prev[curr] = currentItemState; // check if a shouldPush property has changed
    return prev;
  }, {});

  return {
    location: {
      ...location,
      search: createParamsString(newQueryParams),
    },
    shouldPush,
  };
}
