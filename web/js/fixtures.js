import proj4 from 'proj4';
import { register } from 'ol/proj/proj4';
import { initialState as initialLayerState } from './modules/layers/reducers';
import { initialCompareState } from './modules/compare/reducers';
import { getInitialState as getInitialDateState } from './modules/date/reducers';
import { defaultState as initialAnimationState } from './modules/animation/reducers';
import { defaultAlertState } from './modules/alerts/reducer';
import { getInitialEventsState } from './modules/natural-events/reducers';
import util from './util/util';
import getConfig from '../mock/config';

const colors = {
  red: 'ff0000ff',
  light_red: 'fff0f0ff',
  dark_red: '400000ff',
  green: '00ff00ff',
  yellow: 'ffff00ff',
  blue: '0000ffff',
  light_blue: 'f0f0ffff',
  dark_blue: '000040',
};

const fixtures = {
  ...colors,
};

fixtures.getState = function() {
  return {
    compare: initialCompareState,
    config: fixtures.config(),
    layers: initialLayerState,
    alerts: defaultAlertState,
    date: getInitialDateState(fixtures.config()),
    events: getInitialEventsState(fixtures.config()),
    map: fixtures.map(),
    animation: initialAnimationState,
    proj: {
      selected: {
        id: 'geographic',
        crs: 'EPSG:4326',
      },
    },
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

fixtures.map = () => ({
  ui: {
    selected: {
      getView: () => ({
        calculateExtent: () => [-15.06, 27.16, 13.32, 56.06],
      }),
    },
  },
});

fixtures.config = function() {
  const now = util.now();
  return {
    pageLoadTime: now,
    initialDate: now,
    now,
    ...getConfig(colors),
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
