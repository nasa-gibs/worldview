import proj4 from 'proj4';
import { register } from 'ol/proj/proj4';

import { dateModel } from './date/model';
import { layersModel } from './layers/model';
import { mapModel } from './map/model';
import { palettesModel } from './palettes/model';
import { projectionModel } from './projection/model';
import { compareModel } from './compare/model';

var fixtures = {
  red: 'ff0000ff',
  light_red: 'fff0f0ff',
  dark_red: '400000ff',
  green: '00ff00ff',
  yellow: 'ffff00ff',
  blue: '0000ffff',
  light_blue: 'f0f0ffff',
  dark_blue: '000040'
};

fixtures.config = function() {
  return {
    defaults: {
      projection: 'geographic'
    },
    projections: {
      geographic: {
        id: 'geographic',
        epsg: 4326,
        crs: 'EPSG:4326',
        maxExtent: [-180, -90, 180, 90]
      },
      arctic: {
        id: 'arctic',
        epsg: 3413,
        crs: 'EPSG:3413'
      },
      antarctic: {
        id: 'antarctic',
        epsg: 3031,
        crs: 'EPSG:3031'
      }
    },
    layers: {
      'terra-cr': {
        id: 'terra-cr',
        group: 'baselayers',
        period: 'daily',
        startDate: '2000-01-01',
        projections: {
          geographic: {},
          arctic: {},
          antarctic: {}
        }
      },
      'aqua-cr': {
        id: 'aqua-cr',
        group: 'baselayers',
        period: 'daily',
        startDate: '2002-01-01',
        projections: {
          geographic: {},
          arctic: {},
          antarctic: {}
        }
      },
      mask: {
        id: 'mask',
        group: 'baselayers',
        projections: {
          geographic: {},
          arctic: {},
          antarctic: {}
        }
      },
      'terra-aod': {
        id: 'terra-aod',
        group: 'overlays',
        period: 'daily',
        startDate: '2000-01-01',
        projections: {
          geographic: {}
        },
        palette: {
          id: 'terra-aod'
        }
      },
      'aqua-aod': {
        id: 'aqua-aod',
        group: 'overlays',
        period: 'daily',
        startDate: '2002-01-01',
        projections: {
          geographic: {}
        },
        palette: {
          id: 'aqua-aod'
        }
      },
      'combo-aod': {
        id: 'combo-aod',
        group: 'overlays',
        projections: {
          geographic: {}
        }
      }
    },
    features: {
      compare: true
    },
    palettes: {
      rendered: {
        'terra-aod': {
          id: 'terra-aod',
          maps: [
            {
              entries: {
                type: 'scale',
                colors: [fixtures.green, fixtures.yellow, fixtures.red],
                values: [0, 1, 2]
              },
              legend: {
                tooltips: ['0', '1', '2'],
                minLabel: '0',
                maxLabel: '2'
              }
            }
          ]
        },
        'aqua-aod': {
          id: 'aqua-aod',
          maps: [
            {
              entries: {
                type: 'scale',
                colors: [fixtures.green, fixtures.yellow, fixtures.red],
                values: [0, 1, 2]
              },
              legend: {
                tooltips: ['0', '1', '2'],
                minLabel: '0',
                maxLabel: '2'
              }
            }
          ]
        }
      },
      custom: {
        'blue-1': {
          colors: [fixtures.light_blue, fixtures.blue, fixtures.dark_blue]
        },
        'red-1': {
          colors: [fixtures.light_red, fixtures.red, fixtures.dark_red]
        }
      }
    }
  };
};

fixtures.models = function(config) {
  var models = {};

  models.proj = projectionModel(config);
  models.layers = layersModel(models, config);
  models.palettes = palettesModel(models, config);
  models.map = mapModel(models, config);
  models.compare = compareModel(models, config);
  models.date = dateModel(models, config);
  return models;
};

export function registerProjections() {
  proj4.defs('EPSG:3413', '+title=WGS 84 / NSIDC Sea Ice Polar Stereographic North +proj=stere +lat_0=90 +lat_ts=70 +lon_0=-45 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs');
  proj4.defs('EPSG:3031', '+title=WGS 84 / Antarctic Polar Stereographic +proj=stere +lat_0=-90 +lat_ts=-71 +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs');
  register(proj4);
}

export default fixtures;
