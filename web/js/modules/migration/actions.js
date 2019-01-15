import { MODELS_HAVE_BEEN_LOADED } from './constants';

export function sendModelsToStore(models) {
  return {
    type: MODELS_HAVE_BEEN_LOADED,
    models: models
  };
}
