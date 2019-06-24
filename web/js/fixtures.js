import proj4 from 'proj4';
import { register } from 'ol/proj/proj4';
import { initialState as initialLayerState } from './modules/layers/reducers';
import { initialCompareState } from './modules/compare/reducers';
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
fixtures.getState = function() {
  return {
    compare: initialCompareState,
    config: fixtures.config(),
    layers: initialLayerState,
    palettes: {
      active: {},
      activeB: {},
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

fixtures.config = function() {
  return {
    defaults: {
      projection: 'geographic',
      startingLayers: [{ id: 'terra-cr' }, { id: 'aqua-cr', hidden: 'true' }]
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
      AMSRE_Brightness_Temp_89H_Night: {
        id: 'AMSRE_Brightness_Temp_89H_Night',
        title: 'Brightness Temperature (89H GHz B Scan, Night)',
        subtitle: 'Aqua / AMSR-E',
        description: 'amsre/AMSRE_Brightness_Temp_89H_Night',
        group: 'overlays',
        product: 'AE_L2A_NIGHT',
        layergroup: ['amsre'],
        projections: {
          geographic: {},
          arctic: {},
          antarctic: {}
        },
        inactive: true
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
      lookups: {
        'terra-aod': {
          'min-1': {
            '0,255,0,255': { r: 0, g: 0, b: 0, a: 0 },
            '255,255,0,255': { r: 255, g: 255, b: 0, a: 255 },
            '255,0,0,255': { r: 255, g: 0, b: 0, a: 255 }
          },
          'red-1': {
            '0,255,0,255': {
              a: 255,
              b: 240,
              g: 240,
              r: 255
            },
            '255,0,0,255': {
              a: 255,
              b: 0,
              g: 0,
              r: 64
            },
            '255,255,0,255': {
              a: 255,
              b: 0,
              g: 0,
              r: 255
            }
          },
          'max-1-squashed': {
            '0,255,0,255': {
              a: 255,
              b: 0,
              g: 255,
              r: 0
            },
            '255,0,0,255': {
              a: 0,
              b: 0,
              g: 0,
              r: 0
            },
            '255,255,0,255': {
              a: 255,
              b: 0,
              g: 0,
              r: 255
            }
          }
        }
      },
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

export function registerProjections() {
  proj4.defs(
    'EPSG:3413',
    '+title=WGS 84 / NSIDC Sea Ice Polar Stereographic North +proj=stere +lat_0=90 +lat_ts=70 +lon_0=-45 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs'
  );
  proj4.defs(
    'EPSG:3031',
    '+title=WGS 84 / Antarctic Polar Stereographic +proj=stere +lat_0=-90 +lat_ts=-71 +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs'
  );
  register(proj4);
}

export default fixtures;
