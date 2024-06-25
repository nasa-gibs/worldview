import { thunk } from 'redux-thunk'; // For ASYNC actions
import { compact } from 'lodash';
import { createLogger } from 'redux-logger';

const loggerMiddleware = createLogger({ collapsed: true });
/**
 * Combine necessary middleware
 * @param {Boolean} enableDebugLogger | Enable redux-logger
 * @param {Object} locationMiddleware | redux-location-state middleware
 */
export default function getMiddleware(enableDebugLogger, locationMiddleware) {
  return enableDebugLogger
    ? compact([thunk, locationMiddleware, loggerMiddleware])
    : compact([thunk, locationMiddleware]);
}
