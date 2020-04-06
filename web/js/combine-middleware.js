import thunkMiddleware from 'redux-thunk'; // For ASYNC actions
import { compact } from 'lodash';
import { createLogger } from 'redux-logger';

const loggerMiddleware = createLogger({ collapsed: true });
/**
 * Combine necessary middleware
 * @param {Boolean} isDebugMode | Server is in debug mode
 * @param {Object} locationMiddleware | redux-location-state middleware
 */
export default function getMiddleware(isDebugMode, locationMiddleware) {
  return isDebugMode
    ? compact([thunkMiddleware, locationMiddleware, loggerMiddleware])
    : compact([thunkMiddleware, locationMiddleware]);
}
