import thunkMiddleware from 'redux-thunk'; // For ASYNC actions
import { compact } from 'lodash';
import { createLogger } from 'redux-logger';

const loggerMiddleware = createLogger({ collapsed: true });

/**
 * Combine necessary middleware
 * @param {Boolean} isDevelop | Is development server
 * @param {Object} locationMiddleware | redux-location-state middleware
 */
export function getMiddleware(isDevelop, locationMiddleware) {
  return isDevelop
    ? compact([thunkMiddleware, locationMiddleware, loggerMiddleware])
    : compact([thunkMiddleware, locationMiddleware]);
}
