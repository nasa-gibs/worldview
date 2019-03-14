import thunkMiddleware from 'redux-thunk'; // For ASYNC actions
import { compact } from 'lodash';
import { createLogger } from 'redux-logger';
const loggerMiddleware = createLogger({ collapsed: true });
/**
 * Combine necessary middleware
 * @param {Boolean} isLogActive | Is Logging active
 * @param {Object} locationMiddleware | redux-location-state middleware
 */
export function getMiddleware(isLogActive, locationMiddleware) {
  return isLogActive
    ? compact([thunkMiddleware, locationMiddleware, loggerMiddleware])
    : compact([thunkMiddleware, locationMiddleware]);
}
