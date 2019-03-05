import { get } from 'redux-location-state/lib/helpers';
import { encode } from '../link/util';
export function getDataDownloadParameterSetup(
  parameters,
  config,
  models,
  legacyState,
  errors
) {
  const loadedModel = models.data.load(legacyState, errors);
  return {
    download: {
      stateKey: 'legacy.data.active',
      initialState: false,
      type: 'bool',
      options: {
        delimiter: ',',
        serializeNeedsGlobalState: true,
        parse: () => {
          return loadedModel.active || false;
        },
        serialize: (currentItemState, currentState) => {
          const selected = get(currentState, 'legacy.data.selectedProduct');
          if (!currentItemState) return false;

          return encode(selected);
        }
      }
    }
  };
}
