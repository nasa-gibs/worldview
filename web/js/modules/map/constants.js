import { getLeadingExtent, serializeExtent, parseMapExtent } from './util';
export const RUNNING_DATA = 'MAP/RUNNING_DATA';
export const CLEAR_RUNNING_DATA = 'MAP/CLEAR_RUNNING_DATA';
export const UPDATE_MAP_EXTENT = 'MAP/UPDATE_MAP_EXTENT';
export const UPDATE_MAP_UI = 'MAP/UPDATE_MAP_UI';
export const UPDATE_MAP_ROTATION = 'MAP/UPDATE_ROTATION';

const LEADING_EXTENT = getLeadingExtent();

export const EXTENT_PARAM_SETUP = {
  stateKey: 'map.extent',
  initialState: LEADING_EXTENT,
  type: 'array',
  options: {
    delimiter: ',',
    parse: parseMapExtent,
    serialize: serializeExtent
  }
};
