import update from 'immutability-helper';
import { find as lodashFind, get as lodashGet } from 'lodash';
/**
 * Update sidebar state when location-pop action occurs
 *
 * @param {Object} parameters | parameters parsed from permalink
 * @param {Object} stateFromLocation | State derived from permalink parsers
 * @param {Object} state | initial state before location POP action
 * @param {Object} config
 */
export default function mapLocationToDataState(
  parameters,
  stateFromLocation,
  state,
  config,
) {
  const productId = parameters.download || parameters.dataDownload;
  if (productId) {
    const activeString = lodashGet(stateFromLocation, 'compare.activeString')
      || lodashGet(state, 'compare.activeString');
    const activeLayers = lodashGet(stateFromLocation, `layers.${activeString}`)
      || lodashGet(state, `layers.${activeString}`);
    if (
      !config.products[productId]
      || !lodashFind(activeLayers, { product: productId })
    ) {
      console.warn(`No such product: ${productId}`);
      stateFromLocation = update(stateFromLocation, {
        data: { selectedProduct: { $set: '' } },
      });
      stateFromLocation = update(stateFromLocation, {
        data: { active: { $set: false } },
      });
    } else {
      stateFromLocation = update(stateFromLocation, {
        data: { active: { $set: true } },
      });
      if (parameters.dataDownload && !parameters.download) {
        stateFromLocation = update(stateFromLocation, {
          data: { selectedProduct: { $set: productId } },
        });
      }
    }
  } else {
    stateFromLocation = update(stateFromLocation, {
      data: { active: { $set: false } },
    });
  }
  return stateFromLocation;
}
