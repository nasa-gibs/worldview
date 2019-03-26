import { cloneDeep as lodashCloneDeep, get } from 'lodash';

export function getTourParameterSetup(
  parameters,
  config,
  models,
  legacyState,
  errors
) {
  const loadedModel = lodashCloneDeep(models.tour.load(legacyState, errors)); // use legacy parser

  return {
    tr: {
      stateKey: 'legacy.tour.selected.id',
      initialState: '',
      options: {
        setAsEmptyItem: true,
        parse: () => {
          return get(loadedModel, 'selected.id') || false;
        },
        serialize: () => {
          const tourActive = get(models, 'tour.active');
          const tourId = get(models, 'tour.selected.id');
          return tourActive && tourId ? tourId : undefined;
        }
      }
    }
  };
}
