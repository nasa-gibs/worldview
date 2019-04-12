import util from './util/util';
import { dateModel } from './date/model';
import { layersModel } from './layers/model';

import { mapModel } from './map/model';
import { animationModel } from './animation/model';
import { palettesModel } from './palettes/model';
import { dataModel } from './data/model';
import { projectionModel } from './projection/model';
import { compareModel } from './compare/model';
import { tourModel } from './tour/model';
import naturalEventsModel from './map/natural-events/model';

/**
 * Return initiated legacy models Object
 * @param {Object} config
 */
export function combineModels(config) {
  let models = {
    wv: {
      events: util.events()
    }
  };
  var initialDate;
  if (config.defaults.startDate) {
    initialDate = util.parseDateUTC(config.defaults.startDate);
  } else {
    initialDate = util.now();
    if (initialDate.getUTCHours() < 3) {
      initialDate.setUTCDate(initialDate.getUTCDate() - 1);
    }
  }
  models.proj = projectionModel(config);
  models.palettes = palettesModel(models, config);
  models.layers = layersModel(models, config);
  models.date = dateModel(models, config, {
    initial: initialDate
  });
  models.map = mapModel(models, config);
  if (config.features.compare) {
    models.compare = compareModel(models, config);
  }
  if (config.features.tour) {
    models.tour = tourModel(config);
  }
  if (config.features.animation) {
    models.anim = animationModel(models, config);
  }
  if (config.features.dataDownload) {
    models.data = dataModel(models, config);
  }
  if (config.features.naturalEvents) {
    models.naturalEvents = naturalEventsModel(models, config);
  }

  return models;
}
