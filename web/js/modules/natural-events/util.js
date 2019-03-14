import { get } from 'lodash';
import { encode } from '../link/util';
export function getNaturalEventsParameterSetup(
  parameters,
  config,
  models,
  legacyState,
  errors
) {
  const loadedModel = models.naturalEvents.load(legacyState, errors);

  return {
    e: {
      stateKey: 'legacy.naturalEvents.active',
      initialState: false,
      type: 'boolean',
      options: {
        delimiter: ',',
        serializeNeedsGlobalState: true,
        parse: () => {
          return loadedModel.active || false;
        },
        serialize: (currentItemState, currentState) => {
          const selected = get(currentState, 'legacy.naturalEvents.selected');
          if (!currentItemState) return false;

          return encode(selected);
        }
      }
    }
  };
}
