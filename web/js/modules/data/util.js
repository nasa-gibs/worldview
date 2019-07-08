import update from 'immutability-helper';
/**
 * Update sidebar state when location-pop action occurs
 *
 * @param {Object} parameters | parameters parsed from permalink
 * @param {Object} stateFromLocation | State derived from permalink parsers
 * @param {Object} state | initial state before location POP action
 * @param {Object} config
 */
export function mapLocationToDataState(
  parameters,
  stateFromLocation,
  state,
  config
) {
  if (parameters.download) {
    const productId = parameters.download;
    if (productId) {
      if (!config.products[productId]) {
        console.warn('No such product: ' + productId);
        stateFromLocation = update(stateFromLocation, {
          data: { selectedProduct: { $set: '' } }
        });
        stateFromLocation = update(stateFromLocation, {
          data: { active: { $set: false } }
        });
      } else {
        stateFromLocation = update(stateFromLocation, {
          data: { active: { $set: true } }
        });
      }
    }
  } else {
    stateFromLocation = update(stateFromLocation, {
      data: { active: { $set: false } }
    });
  }
  return stateFromLocation;
}
