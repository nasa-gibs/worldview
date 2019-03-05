import { cloneDeep as lodashCloneDeep, get } from 'lodash';

export function getAnimationParameterSetup(
  parameters,
  config,
  models,
  legacyState,
  errors
) {
  const loadedModel = lodashCloneDeep(models.anim.load(legacyState, errors)); // use legacy parser
  const initialEnd = get(models, 'date.selected');
  const initialStart = get(models, 'date.selectedB');

  return {
    ab: {
      stateKey: 'legacy.anim.rangeState.state',
      initialState: 'off',
      options: {
        parse: () => {
          return get(loadedModel, 'rangeState.state') || 'off';
        },
        serialize: () => {
          return get(models, 'anim.rangeState.state') || 'off';
        }
      }
    },
    as: {
      stateKey: 'legacy.anim.rangeState.startDate',
      initialState: initialEnd,
      type: 'date',
      options: {
        parse: () => {
          return get(loadedModel, 'rangeState.startDate');
        },
        serialize: () => {
          const isAnimationActive =
            get(models, 'anim.rangeState.state') === 'on';
          return isAnimationActive
            ? get(models, 'anim.rangeState.startDate')
            : undefined;
        }
      }
    },
    ae: {
      stateKey: 'legacy.anim.rangeState.endDate',
      initialState: initialStart,
      type: 'date',
      options: {
        parse: () => {
          return get(loadedModel, 'rangeState.endDate') || undefined;
        },
        serialize: () => {
          const isAnimationActive =
            get(models, 'anim.rangeState.state') === 'on';
          return isAnimationActive
            ? get(models, 'anim.rangeState.endDate')
            : undefined;
        }
      }
    },
    av: {
      stateKey: 'legacy.anim.rangeState.speed',
      initialState: 3.0,
      type: 'number',
      options: {
        serializeNeedsGlobalState: true,
        parse: () => {
          return get(loadedModel, 'anim.rangeState.speed') || 3.0;
        },
        serialize: (currentItemState, state) => {
          const isAnimationActive =
            get(models, 'anim.rangeState.state') === 'on';
          return isAnimationActive
            ? get(models, 'anim.rangeState.speed')
            : undefined;
        }
      }
    },
    al: {
      stateKey: 'legacy.anim.rangeState.loop',
      type: 'bool',
      initialState: false,
      options: {
        setAsEmptyItem: true,
        parse: () => {
          return get(loadedModel, 'rangeState.loop');
        },
        serialize: (currentItemState, state) => {
          const isAnimationActive =
            get(models, 'anim.rangeState.state') === 'on';
          return isAnimationActive
            ? get(models, 'anim.rangeState.loop')
            : undefined;
        }
      }
    }
  };
}
