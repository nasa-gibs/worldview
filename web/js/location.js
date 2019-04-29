import { assign as lodashAssign, has, set, get } from 'lodash';
import { encode } from './modules/link/util';

// legacy crutches
// import { getLayersParameterSetup } from './modules/layers/util';
import { getDateParameterSetup } from './modules/date/util';

import { defaultDataState } from './modules/data/constants';
import { getAnimationParameterSetup } from './modules/animation/util';
import { getTourParameterSetup } from './modules/tour/util';
import { getMapParameterSetup } from './modules/map/util';
import { eventParse, serializeEvent } from './modules/natural-events/util';
import {
  layersParse11,
  layersParse12,
  serializeLayers
} from './modules/layers/util';
import { resetLayers } from './modules/layers/selectors';
import { eventsReducerState } from './modules/natural-events/reducers';
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
    if (stateFromLocation.compare) {
      stateFromLocation = update(stateFromLocation, {
        compare: { active: { $set: true } }
      });
    }
    // legacy layers permalink
    if (state.parameters.product) {
      stateFromLocation = update(stateFromLocation, {
        layers: {
          active: {
            $set: layersParse11(state.parameters.product, state.config)
          }
        }
      });
    }
    // one level deep merge
    for (var key in stateFromLocation) {
      const obj = lodashAssign({}, state[key], stateFromLocation[key]);
      stateFromLocation = update(stateFromLocation, {
        [key]: { $set: obj }
      });
    }
    return update(state, { $merge: stateFromLocation });
  } else return state;
}

const getParameters = function(config) {
  return {
    p: {
      stateKey: 'proj.id',
      initialState: 'geographic'
    },
    e: {
      stateKey: 'events',
      type: 'object',
      initialState: eventsReducerState,
      options: {
        parse: eventParse,
        serialize: serializeEvent
      }
    },
    l: {
      stateKey: 'layers.active',
      initialState: resetLayers(config.defaults.startingLayers, config.layers),
      type: 'array',
      options: {
        parse: permalink => {
          return layersParse12(permalink, config);
        },
        serializeNeedsGlobalState: true,
        serialize: (currentLayers, state) => {
          return serializeLayers(currentLayers, state, 'active');
        }
      }
    },
    l1: {
      stateKey: 'layers.activeB',
      initialState: [],
      type: 'array',
      options: {
        parse: permalink => {
          return layersParse12(permalink, config);
        },
        serializeNeedsGlobalState: true,
        serialize: (currentLayers, state) => {
          return serializeLayers(currentLayers, state, 'activeB');
        }
      }
    },
    ca: {
      stateKey: 'compare.isCompareA',
      initialState: true,
      type: 'bool',
      options: {
        setAsEmptyItem: true,
        serializeNeedsGlobalState: true,
        serialize: (currentItemState, state) => {
          const compareIsActive = get(state, 'compare.active');
          return compareIsActive ? currentItemState : undefined;
        }
      }
    },
    cm: {
      stateKey: 'compare.mode',
      initialState: 'swipe'
    },
    cv: {
      stateKey: 'compare.value',
      initialState: 50,
      type: 'number'
    },
    download: {
      stateKey: 'data.selectedProduct',
      initialState: '',
      type: 'string',
      options: {
        delimiter: ',',
        serializeNeedsGlobalState: true,
        parse: id => {
          if (!config.products[id]) {
            console.warn('No such product: ' + id);
            return '';
          }
          return id;
        },
        serialize: (currentItemState, state) => {
          if (!state.sidebar.activeTab !== 'download') return undefined;
          return encode(currentItemState);
        }
      }
    }
  };
};

export function getParamObject(
  parameters,
  config,
  models,
  legacyState,
  errors
) {
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
  const dateParamObject = getDateParameterSetup(
    parameters,
    config,
    models,
    legacyState,
    errors
  );
  // const dataParamObject = getDataDownloadParameterSetup(
  //   parameters,
  //   config,
  //   models,
  //   legacyState,
  //   errors
  // );

  const obj = lodashAssign(
    {},
    dateParamObject,
    animationParamObject,
    // dataParamObject,
    tourParamObject,
    mapParamObject,
    getParameters(config)
  );
  return {
    global: obj
  };
}
