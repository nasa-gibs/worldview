import { getLeadingExtent, serializeExtent, parseMapExtent } from './util';
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
