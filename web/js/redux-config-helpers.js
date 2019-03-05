import thunkMiddleware from 'redux-thunk'; // For ASYNC actions
import { compact } from 'lodash';
import { createLogger } from 'redux-logger';
const loggerMiddleware = createLogger({ collapsed: true });
export function getMiddleware(isDevelop, locationMiddleware) {
  return isDevelop
    ? compact([thunkMiddleware, locationMiddleware, loggerMiddleware])
    : compact([thunkMiddleware, locationMiddleware]);
}
