import { assign, has, set, get } from 'lodash';

// legacy crutches
import { getLayersParameterSetup } from './modules/layers/util';
import { getDateParameterSetup } from './modules/date/util';
import { getNaturalEventsParameterSetup } from './modules/natural-events/util';
import { getDataDownloadParameterSetup } from './modules/data/util';
import { getAnimationParameterSetup } from './modules/animation/util';
import { getTourParameterSetup } from './modules/tour/util';
import { getMapParameterSetup } from './modules/map/util';
import update from 'immutability-helper';

export function mapLocationToState(state, location) {
  if (location.search) {
    let stateFromLocation = location.query;
    const projId = get(stateFromLocation, 'proj.id');
    if (projId) {
      let selected = get(state, `config.projections.${projId}`) || {};
      stateFromLocation = update(stateFromLocation, {
        proj: { selected: { $set: selected } }
      });
    }
    return update(state, { $merge: stateFromLocation });
  } else return state;
}
const simpleParameters = {
  p: {
    stateKey: 'proj.id',
    initialState: 'geographic'
  }
};
// ca: {
//   stateKey: 'compare.isCompareA',
//   initialState: true,
//   type: 'bool',
//   options: {
//     setAsEmptyItem: true,
//     serializeNeedsGlobalState: true,
//     serialize: (currentItemState, state) => {
//       const compareIsActive = get(state, 'compare.active');
//       return compareIsActive ? currentItemState : undefined;
//     }
//   }
// },
// cm: {
//   stateKey: 'compare.mode',
//   initialState: 'swipe'
// },
// cv: {
//   stateKey: 'compare.value',
//   initialState: 50,
//   type: 'number'
// }
// };
export function getParamObject(
  parameters,
  config,
  models,
  legacyState,
  errors
) {
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
    dateParamObject,
    layersParamObject,
    animationParamObject,
    eventParamObject,
    dataParamObject,
    tourParamObject,
    mapParamObject,
    simpleParameters
  );
  return {
    global: obj
  };
}
