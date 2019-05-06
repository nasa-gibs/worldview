import util from '../../util/util';
import { encode } from '../link/util';
import {
  each as lodashEach,
  isUndefined as lodashIsUndefined,
  map as lodashMap
} from 'lodash';

export function getMapParameterSetup(
  parameters,
  config,
  models,
  legacyState,
  errors
) {
  models.map.load(legacyState, errors);
  const leadingExtent = getLeadingExtent();
  return {
    v: {
      stateKey: 'legacy.map.extent',
      initialState: leadingExtent,
      type: 'array',
      options: {
        delimiter: ',',
        parse: state => {
          var extent = lodashMap(state.split(','), function(str) {
            return parseFloat(str);
          });
          var valid = mapIsExtentValid(extent);
          if (!valid) {
            errors.push({
              message: 'Invalid extent: ' + state
            });
            return leadingExtent;
          } else {
            return extent;
          }
        },
        serialize: (currentItemState, currentState) => {
          const extent = mapIsExtentValid(currentItemState)
            ? currentItemState
            : leadingExtent;
          return encode(extent);
        }
      }
    },
    r: {
      stateKey: 'legacy.map.rotation',
      initialState: 0,
      options: {
        parse: state => {
          return !isNaN(state) ? state * (Math.PI / 180.0) : 0;
        },
        serialize: (currentItemState, currentState) => {
          return models.map.rotation
            ? (models.map.rotation * (180.0 / Math.PI)).toPrecision(6)
            : undefined;
        }
      }
    }
  };
}
/**
 * Determines if an exent object contains valid values.
 *
 * @method isExtentValid
 * @static
 *
 * @param extent {OpenLayers.Bound} The extent to check.
 *
 * @return {boolean} False if any of the values is NaN, otherwise returns
 * true.
 */
export function mapIsExtentValid(extent) {
  if (lodashIsUndefined(extent)) {
    return false;
  }
  var valid = true;
  if (extent.toArray) {
    extent = extent.toArray();
  }
  lodashEach(extent, function(value) {
    if (isNaN(value)) {
      valid = false;
      return false;
    }
  });
  return valid;
}
export function getLeadingExtent() {
  var curHour = util.now().getUTCHours();

  // For earlier hours when data is still being filled in, force a far eastern perspective
  if (curHour < 3) {
    curHour = 23;
  } else if (curHour < 9) {
    curHour = 0;
  }

  // Compute east/west bounds
  var minLon = 20.6015625 + curHour * (-200.53125 / 23.0);
  var maxLon = minLon + 159.328125;

  var minLat = -46.546875;
  var maxLat = 53.015625;

  return [minLon, minLat, maxLon, maxLat];
}
