import { CONFIG_HAS_BEEN_LOADED } from './constants';

export function sendConfigToStore(models, config) {
  return {
    type: CONFIG_HAS_BEEN_LOADED,
    models: models,
    config: config
  };
}
