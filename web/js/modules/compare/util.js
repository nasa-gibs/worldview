import { cloneDeep as lodashCloneDeep, get } from 'lodash';

export function getCompareParameterSetup(
  parameters,
  config,
  models,
  legacyState,
  errors
) {
  const loadedModel = lodashCloneDeep(models.compare.load(legacyState, errors)); // use legacy parser
  return {
    ca: {
      stateKey: 'legacy.compare.isCompareA',
      initialState: true,
      type: 'bool',
      options: {
        setAsEmptyItem: true,
        serializeNeedsGlobalState: true,
        parse: () => {
          return loadedModel.isCompareA;
        },
        serialize: (currentItemState, state) => {
          const compareIsActive = get(state, 'legacy.compare.active');
          return compareIsActive ? currentItemState : undefined;
        }
      }
    },
    cm: {
      stateKey: 'legacy.compare.mode',
      initialState: 'swipe',
      options: {
        serializeNeedsGlobalState: true,
        parse: () => {
          return loadedModel.mode || 'swipe';
        },
        serialize: (currentItemState, state) => {
          const compareIsActive = get(state, 'legacy.compare.active');
          return compareIsActive ? currentItemState || 'swipe' : undefined;
        }
      }
    },
    cv: {
      stateKey: 'legacy.compare.value',
      initialState: 50,
      type: 'number',
      options: {
        serializeNeedsGlobalState: true,
        parse: () => {
          return loadedModel.value || 50;
        },
        serialize: (currentItemState, state) => {
          const compareIsActive = get(state, 'legacy.compare.active');
          return compareIsActive ? currentItemState || 50 : undefined;
        }
      }
    }
  };
}
