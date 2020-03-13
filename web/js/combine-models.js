import util from './util/util';
import { mapModel } from './map/model';

/**
 * Return initiated legacy models Object
 * @param {Object} config
 */
export function combineModels(config) {
  const models = {
    wv: {
      events: util.events(),
    },
  };
  models.map = mapModel(models, config);

  return models;
}
