import {
  CONFIG_HAS_BEEN_LOADED,
  INIT_COMPLETE,
  UPDATE_IN_LEGACY_STATE
} from './constants';

export function sendConfigToStore(models, config) {
  return {
    type: CONFIG_HAS_BEEN_LOADED,
    models: models,
    config: config
  };
}

export function updateLegacyModule(key, model) {
  return {
    type: UPDATE_IN_LEGACY_STATE,
    key: key,
    model: model
  };
}
export function updateLegacyInitComplete() {
  return {
    type: INIT_COMPLETE
  };
}
