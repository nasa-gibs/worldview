import { getLeadingExtent, serializeExtent, parseMapExtent } from './util';
export const RUNNING_DATA = 'MAP/RUNNING_DATA';
export const CLEAR_RUNNING_DATA = 'MAP/CLEAR_RUNNING_DATA';
const LEADING_EXTENT = getLeadingExtent();

export const EXTENT_PARAM_SETUP = {
  stateKey: 'legacy.map.extent',
  initialState: LEADING_EXTENT,
  type: 'array',
  options: {
    delimiter: ',',
    parse: parseMapExtent,
    serialize: serializeExtent
  }
};
