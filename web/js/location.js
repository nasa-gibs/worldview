import { merge as lodashMerge, assign, has, set } from 'lodash';

// legacy crutches
import { getLayersParameterSetup } from './modules/layers/util';
import { getDateParameterSetup } from './modules/date/util';
import { getNaturalEventsParameterSetup } from './modules/natural-events/util';
import { getDataDownloadParameterSetup } from './modules/data/util';
import { getCompareParameterSetup } from './modules/compare/util';
import { getAnimationParameterSetup } from './modules/animation/util';
import { getTourParameterSetup } from './modules/tour/util';
import { getMapParameterSetup } from './modules/map/util';
import util from './util/util';

export function mapLocationToState(state, location) {
  if (location.search) {
    let parameters = util.fromQueryString(location.search);
    let stateFromLocation = location.query;
    if (has(parameters, 'ca')) {
      set(stateFromLocation, 'legacy.compare.active', true);
    } else {
      set(stateFromLocation, 'legacy.compare.active', false);
    }
    return lodashMerge({}, state, stateFromLocation);
  } else return state;
}
const simpleParameters = {
  p: {
    stateKey: 'proj.id',
    initialState: 'geographic'
  }
};
export function getParamObject(
  parameters,
  config,
  models,
  legacyState,
  errors
) {
  let compareParamObject = {};
  let eventParamObject = {};
  let tourParamObject = {};
  let animationParamObject = {};

  const mapParamObject = getMapParameterSetup(
    parameters,
    config,
    models,
    legacyState,
    errors
  );
  if (config.features.compare) {
    compareParamObject = getCompareParameterSetup(
      parameters,
      config,
      models,
      legacyState,
      errors
    );
  }
  if (config.features.tour) {
    tourParamObject = getTourParameterSetup(
      parameters,
      config,
      models,
      legacyState,
      errors
    );
  }
  if (config.features.animation) {
    animationParamObject = getAnimationParameterSetup(
      parameters,
      config,
      models,
      legacyState,
      errors
    );
  }
  const layersParamObject = getLayersParameterSetup(
    parameters,
    config,
    models,
    legacyState,
    errors
  );
  const dateParamObject = getDateParameterSetup(
    parameters,
    config,
    models,
    legacyState,
    errors
  );
  if (config.features.naturalEvents) {
    eventParamObject = getNaturalEventsParameterSetup(
      parameters,
      config,
      models,
      legacyState,
      errors
    );
  }
  const dataParamObject = getDataDownloadParameterSetup(
    parameters,
    config,
    models,
    legacyState,
    errors
  );

  const obj = assign(
    {},
    simpleParameters, // Once migrated completely to redux most configurations should be here
    dateParamObject,
    layersParamObject,
    animationParamObject,
    eventParamObject,
    dataParamObject,
    compareParamObject,
    tourParamObject,
    mapParamObject
  );
  return {
    global: obj
  };
}
