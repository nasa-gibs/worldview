import proj4 from 'proj4';
import { register } from 'ol/proj/proj4';
import { initialState as initialLayerState } from './modules/layers/reducers';
import { initialCompareState } from './modules/compare/reducers';
import { getInitialState as getInitialDateState } from './modules/date/reducers';
import { defaultState as initialAnimationState } from './modules/animation/reducers';
import { defaultAlertState } from './modules/alerts/reducer';

const fixtures = {
  red: 'ff0000ff',
  light_red: 'fff0f0ff',
  dark_red: '400000ff',
  green: '00ff00ff',
  yellow: 'ffff00ff',
  blue: '0000ffff',
  light_blue: 'f0f0ffff',
  dark_blue: '000040',
};
fixtures.getState = function() {
  return {
    compare: initialCompareState,
    config: fixtures.config(),
    layers: initialLayerState,
    alerts: defaultAlertState,
    date: getInitialDateState(fixtures.config()),
    animation: initialAnimationState,
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
                values: [0, 1, 2],
                refs: ['0', '1', '2'],
              },
              legend: {
                tooltips: ['0', '1', '2'],
                colors: [fixtures.green, fixtures.yellow, fixtures.red],
                minLabel: '0',
                maxLabel: '2',
                refs: ['0', '1', '2'],
              },
            },
          ],
        },
        'aqua-aod': {
          id: 'aqua-aod',
          maps: [
            {
              entries: {
                type: 'scale',
                colors: [fixtures.green, fixtures.yellow, fixtures.red],
                values: [0, 1, 2],
                refs: ['0', '1', '2'],
              },
              legend: {
                tooltips: ['0', '1', '2'],
                colors: [fixtures.green, fixtures.yellow, fixtures.red],
                minLabel: '0',
                maxLabel: '2',
                refs: ['0', '1', '2'],
              },
            },
          ],
        },
      },
      custom: {
        'blue-1': {
          colors: [fixtures.light_blue, fixtures.blue, fixtures.dark_blue],
        },
        'red-1': {
          colors: [fixtures.light_red, fixtures.red, fixtures.dark_red],
        },
      },
    },
    vectorStyles: {
      custom: {
        OrbitTracks_Aura_Ascending: {
          version: 8,
          name: 'Orbit Tracks',
          sources: {
            OrbitTracks_Aqua_Ascending: {
              type: 'vector',
              tiles: [
                'https://gibs.earthdata.nasa.gov/wmts/epsg4326/nrt/OrbitTracks_Aqua_Ascending/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.mvt',
              ],
            },
            yellow1: {
              type: 'vector',
              tiles: [
                'https://gibs.earthdata.nasa.gov/wmts/epsg4326/nrt/OrbitTracks_Aqua_Ascending/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.mvt',
              ],
            },
          },
          layers: [
            {
              id: 'OrbitTracks_Aqua_Ascending',
              source: 'OrbitTracks_Aqua_Ascending',
              'source-layer': 'OrbitTracks_Aqua_Ascending',
              'source-description': 'Default',
              type: 'line',
              paint: {
                'line-color': 'rgb(21, 192, 230)',
                'line-width': 2,
              },
            },
            {
              id: 'OrbitTracks_Aqua_Ascending',
              source: 'OrbitTracks_Aqua_Ascending',
              'source-layer': 'OrbitTracks_Aqua_Ascending',
              'source-description': 'Default',
              type: 'circle',
              paint: {
                'circle-radius': '5',
                'circle-color': 'rgb(21, 192, 230)',
              },
            },
            {
              id: 'OrbitTracks_Aqua_Ascending',
              source: 'OrbitTracks_Aqua_Ascending',
              'source-layer': 'OrbitTracks_Aqua_Ascending',
              'source-description': 'Default',
              type: 'symbol',
              layout: {
                'text-field': ['get', 'label'],
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-size': 10,
                'text-transform': 'uppercase',
                'text-letter-spacing': 0.05,
                'text-offset': [-2.5, 0],
              },
              paint: {
                'text-color': '#fff',
                'text-halo-color': '#999',
                'text-halo-width': 1,
              },
            },
            {
              id: 'yellow1',
              source: 'yellow1',
              'source-layer': 'OrbitTracks_Aqua_Ascending',
              'source-description': 'Yellow 1',
              type: 'line',
              paint: {
                'line-color': 'rgb(204, 255, 51)',
                'line-width': 2,
              },
            },
            {
              id: 'yellow1',
              source: 'yellow1',
              'source-layer': 'OrbitTracks_Aqua_Ascending',
              'source-description': 'Yellow 1',
              type: 'circle',
              paint: {
                'circle-radius': '5',
                'circle-color': 'rgb(204, 255, 51)',
              },
            },
            {
              id: 'yellow1',
              source: 'yellow1',
              'source-layer': 'OrbitTracks_Aqua_Ascending',
              'source-description': 'Yellow 1',
              type: 'symbol',
              layout: {
                'text-field': ['get', 'label'],
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-size': 10,
                'text-transform': 'uppercase',
                'text-letter-spacing': 0.05,
                'text-offset': [-2.5, 0],
              },
              paint: {
                'text-color': '#fff',
                'text-halo-color': '#999',
                'text-halo-width': 1,
              },
            },
          ],
        },
      },
    },
  };
};

fixtures.config = function() {
  return {
    pageLoadTime: new Date(),
    initialDate: new Date(),
    now: new Date(),
    defaults: {
      projection: 'geographic',
      startingLayers: [
        { id: 'terra-aod' },
        { id: 'terra-cr' },
        { id: 'aqua-cr', hidden: 'true' },
      ],
    },
    projections: {
      geographic: {
        id: 'geographic',
        epsg: 4326,
        crs: 'EPSG:4326',
        maxExtent: [-180, -90, 180, 90],
      },
      arctic: {
        id: 'arctic',
        epsg: 3413,
        crs: 'EPSG:3413',
      },
      antarctic: {
        id: 'antarctic',
        epsg: 3031,
        crs: 'EPSG:3031',
      },
    },
    layers: {
      'terra-cr': {
        id: 'terra-cr',
        group: 'baselayers',
        dateRanges: [
          {
            dateInterval: '1',
            endDate: '2020-05-20T00:00:00Z',
            startDate: '2000-02-24T00:00:00Z',
          },
        ],
        period: 'daily',
        startDate: '2000-02-24T00:00:00Z',
        projections: {
          geographic: {},
          arctic: {},
          antarctic: {},
        },
      },
      'aqua-cr': {
        id: 'aqua-cr',
        group: 'baselayers',
        period: 'daily',
        startDate: '2002-01-01',
        projections: {
          geographic: {},
          arctic: {},
          antarctic: {},
        },
      },
      mask: {
        id: 'mask',
        group: 'baselayers',
        projections: {
          geographic: {},
          arctic: {},
          antarctic: {},
        },
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
          antarctic: {},
        },
        inactive: true,
      },
      MODIS_Combined_L4_LAI_4Day: {
        id: 'MODIS_Combined_L4_LAI_4Day',
        title: 'Leaf Area Index (L4, 4-Day)',
        subtitle: 'Terra and Aqua / MODIS',
        description: 'modis/combined/MODIS_Combined_L4_LAI_4Day',
        group: 'overlays',
        product: 'MCD15A3H',
        layergroup: 'Leaf Area Index',
        dateRanges: [
          {
            startDate: '2018-01-01T00:00:00Z',
            endDate: '2018-12-27T00:00:00Z',
            dateInterval: '4',
          },
          {
            startDate: '2019-01-01T00:00:00Z',
            endDate: '2019-12-27T00:00:00Z',
            dateInterval: '4',
          },
          {
            startDate: '2020-01-01T00:00:00Z',
            endDate: '2020-09-26T00:00:00Z',
            dateInterval: '4',
          },
        ],
        projections: {
          geographic: {},
          arctic: {},
          antarctic: {},
        },
      },
      'terra-aod': {
        id: 'terra-aod',
        group: 'overlays',
        period: 'daily',
        startDate: '2000-01-01',
        layergroup: 'AOD',
        projections: {
          geographic: {},
        },
        palette: {
          id: 'terra-aod',
        },
      },
      'aqua-aod': {
        id: 'aqua-aod',
        group: 'overlays',
        period: 'daily',
        startDate: '2002-01-01',
        layergroup: 'AOD',
        projections: {
          geographic: {},
        },
        palette: {
          id: 'aqua-aod',
        },
      },
      'combo-aod': {
        id: 'combo-aod',
        group: 'overlays',
        layergroup: 'AOD',
        projections: {
          geographic: {},
        },
      },
      OrbitTracks_Aqua_Ascending: {
        id: 'OrbitTracks_Aqua_Ascending',
        title: 'Orbit Tracks (Ascending, Points, Aqua)',
        subtitle: '',
        description: 'vector/OrbitTracks_Aqua_Ascending',
        type: 'vector',
        tags: 'vector vectors',
        group: 'overlays',
        layergroup: 'Orbital Track',
        inactive: true,
        vectorStyle: {
          id: 'OrbitTracks_Aqua_Ascending',
        },
        period: 'daily',
      },
    },
    features: {
      compare: true,
    },
    palettes: {
      lookups: {
        'terra-aod': {
          'min-1': {
            '0,255,0,255': {
              r: 0, g: 0, b: 0, a: 0,
            },
            '255,255,0,255': {
              r: 255, g: 255, b: 0, a: 255,
            },
            '255,0,0,255': {
              r: 255, g: 0, b: 0, a: 255,
            },
          },
          'red-1': {
            '0,255,0,255': {
              a: 255,
              b: 240,
              g: 240,
              r: 255,
            },
            '255,0,0,255': {
              a: 255,
              b: 0,
              g: 0,
              r: 64,
            },
            '255,255,0,255': {
              a: 255,
              b: 0,
              g: 0,
              r: 255,
            },
          },
          'max-1-squashed': {
            '0,255,0,255': {
              a: 255,
              b: 0,
              g: 255,
              r: 0,
            },
            '255,0,0,255': {
              a: 0,
              b: 0,
              g: 0,
              r: 0,
            },
            '255,255,0,255': {
              a: 255,
              b: 0,
              g: 0,
              r: 255,
            },
          },
        },
      },
      rendered: {
        'terra-aod': {
          id: 'terra-aod',
          maps: [
            {
              entries: {
                type: 'scale',
                colors: [fixtures.green, fixtures.yellow, fixtures.red],
                values: [0, 1, 2],
                refs: ['0', '1', '2'],

              },
              legend: {
                tooltips: ['0', '1', '2'],
                minLabel: '0',
                maxLabel: '2',
                refs: ['0', '1', '2'],
              },
            },
          ],
        },
        'aqua-aod': {
          id: 'aqua-aod',
          maps: [
            {
              entries: {
                type: 'scale',
                colors: [fixtures.green, fixtures.yellow, fixtures.red],
                values: [0, 1, 2],
                refs: ['0', '1', '2'],

              },
              legend: {
                tooltips: ['0', '1', '2'],
                minLabel: '0',
                maxLabel: '2',
                refs: ['0', '1', '2'],
              },
            },
          ],
        },
      },
      custom: {
        'blue-1': {
          colors: [fixtures.light_blue, fixtures.blue, fixtures.dark_blue],
        },
        'red-1': {
          colors: [fixtures.light_red, fixtures.red, fixtures.dark_red],
        },
      },
    },
    vectorData: {
      OrbitTracks: {
        id: 'Orbit_Tracks',
        mvt_properties: [
          {
            Function: 'Style',
            Description: 'Up/Down/Both',
            IsOptional: 'False',
            Title: 'Direction of travel',
            DataType: 'string',
            ValueList: ['Ascending', 'Descending', 'Transitional'],
            Identifier: 'direction',
          },
          {
            Function: 'Describe',
            Description: 'The datetime, in UTC.',
            IsOptional: 'False',
            Title: 'Datetime',
            DataType: 'datetime',
            Identifier: 'datetime',
          },
          {
            Function: 'Describe',
            Description: 'Was it day or night?',
            IsOptional: 'False',
            Title: 'Day/Night Flag',
            DataType: 'string',
            ValueList: ['Day', 'Night', 'Both'],
            Identifier: 'day_night',
          },
          {
            Function: 'Describe',
            Description: 'Just an ID',
            IsOptional: 'False',
            Title: 'Identifier',
            DataType: 'int',
            Identifier: 'id',
          },
          {
            Function: 'Identify',
            Description: 'Default time (hh:mm:ss).',
            IsOptional: 'False',
            Title: 'Label for default display',
            DataType: 'string',
            Identifier: 'label',
          },
        ],
      },
    },
    vectorStyles: {
      OrbitTracks_Aura_Ascending: {
        version: 8,
        name: 'Orbit Tracks',
        sources: {
          OrbitTracks_Aqua_Ascending: {
            type: 'vector',
            tiles: [
              'https://gibs.earthdata.nasa.gov/wmts/epsg4326/nrt/OrbitTracks_Aqua_Ascending/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.mvt',
            ],
          },
          yellow1: {
            type: 'vector',
            tiles: [
              'https://gibs.earthdata.nasa.gov/wmts/epsg4326/nrt/OrbitTracks_Aqua_Ascending/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.mvt',
            ],
          },
        },
        layers: [
          {
            id: 'OrbitTracks_Aqua_Ascending',
            source: 'OrbitTracks_Aqua_Ascending',
            'source-layer': 'OrbitTracks_Aqua_Ascending',
            'source-description': 'Default',
            type: 'line',
            paint: {
              'line-color': 'rgb(21, 192, 230)',
              'line-width': 2,
            },
          },
          {
            id: 'OrbitTracks_Aqua_Ascending',
            source: 'OrbitTracks_Aqua_Ascending',
            'source-layer': 'OrbitTracks_Aqua_Ascending',
            'source-description': 'Default',
            type: 'circle',
            paint: {
              'circle-radius': '5',
              'circle-color': 'rgb(21, 192, 230)',
            },
          },
          {
            id: 'OrbitTracks_Aqua_Ascending',
            source: 'OrbitTracks_Aqua_Ascending',
            'source-layer': 'OrbitTracks_Aqua_Ascending',
            'source-description': 'Default',
            type: 'symbol',
            layout: {
              'text-field': ['get', 'label'],
              'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
              'text-size': 10,
              'text-transform': 'uppercase',
              'text-letter-spacing': 0.05,
              'text-offset': [-2.5, 0],
            },
            paint: {
              'text-color': '#fff',
              'text-halo-color': '#999',
              'text-halo-width': 1,
            },
          },
          {
            id: 'yellow1',
            source: 'yellow1',
            'source-layer': 'OrbitTracks_Aqua_Ascending',
            'source-description': 'Yellow 1',
            type: 'line',
            paint: {
              'line-color': 'rgb(204, 255, 51)',
              'line-width': 2,
            },
          },
          {
            id: 'yellow1',
            source: 'yellow1',
            'source-layer': 'OrbitTracks_Aqua_Ascending',
            'source-description': 'Yellow 1',
            type: 'circle',
            paint: {
              'circle-radius': '5',
              'circle-color': 'rgb(204, 255, 51)',
            },
          },
          {
            id: 'yellow1',
            source: 'yellow1',
            'source-layer': 'OrbitTracks_Aqua_Ascending',
            'source-description': 'Yellow 1',
            type: 'symbol',
            layout: {
              'text-field': ['get', 'label'],
              'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
              'text-size': 10,
              'text-transform': 'uppercase',
              'text-letter-spacing': 0.05,
              'text-offset': [-2.5, 0],
            },
            paint: {
              'text-color': '#fff',
              'text-halo-color': '#999',
              'text-halo-width': 1,
            },
          },
        ],
      },
    },
  };
};

export function registerProjections() {
  proj4.defs(
    'EPSG:3413',
    '+title=WGS 84 / NSIDC Sea Ice Polar Stereographic North +proj=stere +lat_0=90 +lat_ts=70 +lon_0=-45 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
  );
  proj4.defs(
    'EPSG:3031',
    '+title=WGS 84 / Antarctic Polar Stereographic +proj=stere +lat_0=-90 +lat_ts=-71 +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
  );
  register(proj4);
}

export default fixtures;
