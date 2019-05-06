import { cloneDeep as lodashCloneDeep, get } from 'lodash';
import googleTagManager from 'googleTagManager';
import util from '../../util/util';

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
export function checkTourBuildTimestamp(config) {
  if (!util.browser.localStorage) return;
  var hideTour = localStorage.getItem('hideTour');

  // Don't start tour if coming in via a permalink
  if (window.location.search && !config.parameters.tour) {
    return false;
  }

  if (hideTour && config.buildDate) {
    let buildDate = new Date(config.buildDate);
    let tourDate = new Date(hideTour);
    // Tour hidden when visiting fresh URL
    googleTagManager.pushEvent({
      event: 'tour_start_hidden',
      buildDate: buildDate,
      tourDate: tourDate
    });
    if (buildDate > tourDate) {
      localStorage.removeItem('hideTour');
      return true;
    } else {
      return false;
    }
  } else if (hideTour) {
    return false;
  } else {
    // Tour shown when visiting fresh URL
    googleTagManager.pushEvent({
      event: 'tour_start'
    });
    return true;
  }
}
