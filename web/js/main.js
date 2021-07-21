/* global DEBUG */
// IE11 corejs polyfills container
import 'core-js/stable';
import 'elm-pep';
import 'regenerator-runtime/runtime';
// IE11 corejs polyfills container
import 'whatwg-fetch';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import {
  createStore,
  applyMiddleware,
  compose as defaultCompose,
} from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import { calculateResponsiveState, responsiveStoreEnhancer } from 'redux-responsive';
import {
  createReduxLocationActions,
  listenForHistoryChange,
} from 'redux-location-state';
import { createBrowserHistory } from 'history';
import { uniqBy, get as lodashGet } from 'lodash';
import getMiddleware from './combine-middleware';
import { mapLocationToState, getParamObject } from './location';
import { stateToParams } from './redux-location-state-customs';
import reducers, { getInitialState } from './modules/combine-reducers';
import App from './app';
import util from './util/util';
import Brand from './brand';
import combineModels from './combine-models';
import parse from './parse';
import combineUi from './combine-ui';
import { preloadPalettes, hasCustomTypePalette } from './modules/palettes/util';
import {
  layersParse12,
  adjustEndDates,
  adjustActiveDateRanges,
  adjustStartDates,
  mockFutureTimeLayerOptions,
} from './modules/layers/util';
import { debugConfig } from './debug';
import { CUSTOM_PALETTE_TYPE_ARRAY } from './modules/palettes/constants';

const history = createBrowserHistory();
const configURI = Brand.url('config/wv.json');
const compose = DEBUG === false || DEBUG === 'logger'
  ? defaultCompose
  : DEBUG === 'devtools' && composeWithDevTools({
    stateSanitizer: (state) => {
      const sanitizedState = {
        ...state,
        map: {
          ...state.map,
          ui: {
            ...state.map.ui,
          },
        },
      };
      delete sanitizedState.map.ui;
      return sanitizedState;
    },
  });
let parameters = util.fromQueryString(window.location.search);
const errors = [];

/**
 *
 * @param {*} config
 * @param {*} legacyState
 */
function render (config, legacyState) {
  config.parameters = parameters;
  debugConfig(config);

  // Get legacy models
  const models = combineModels(config, legacyState);

  // Get Permalink parse/serializers
  const paramSetup = getParamObject(
    parameters,
    config,
    models,
    legacyState,
    errors,
  );

  const {
    locationMiddleware,
    reducersWithLocation,
  } = createReduxLocationActions(
    paramSetup,
    mapLocationToState,
    history,
    reducers,
    stateToParams,
  );
  const middleware = getMiddleware(DEBUG === 'logger', locationMiddleware);
  const store = createStore(
    reducersWithLocation,
    getInitialState(models, config, parameters),
    compose(
      applyMiddleware(...middleware),
      responsiveStoreEnhancer,
    ),
  );
  listenForHistoryChange(store, history);

  ReactDOM.render(
    <Provider store={store}>
      <App models={models} store={store} />
    </Provider>,
    document.getElementById('app'),
  );
  combineUi(models, config, store); // Legacy UI
  util.errorReport(errors);
}

// Document ready function
window.onload = () => {
  const promise = fetch(configURI);

  promise
    .then((response) => {
      if (!response.ok) {
        throw Error('Could not load config');
      }
      return response.json();
    })
    .then((config) => {
    // Perform check to see if app was in the midst of a tour
      const hasTour = lodashGet(config, `stories[${parameters.tr}]`);
      if (hasTour) {
        const isMockTour = parameters.mockTour;
        // Gets the extent of the first tour step and overrides view params
        parameters = util.fromQueryString(hasTour.steps[0].stepLink);
        parameters.mockTour = isMockTour;
      }

      const crs = calculateResponsiveState(window);
      config.initialIsMobile = crs.innerWidth <= 768;

      config.pageLoadTime = parameters.now
        ? util.parseDateUTC(parameters.now) || new Date()
        : new Date();

      const pageLoadTime = new Date(config.pageLoadTime);

      config.initialDate = config.pageLoadTime.getUTCHours() < 3
        ? new Date(pageLoadTime.setUTCDate(pageLoadTime.getUTCDate() - 1))
        : pageLoadTime;

      config.palettes = {
        rendered: {},
        custom: {},
      };

      // Determine which layers need to be preloaded
      let layers = [];
      if (
        (parameters.l && hasCustomTypePalette(parameters.l))
        || (parameters.l1 && hasCustomTypePalette(parameters.l1))
      ) {
        if (parameters.l && hasCustomTypePalette(parameters.l)) {
          layers.push(...layersParse12(parameters.l, config));
        }

        if (parameters.l1 && hasCustomTypePalette(parameters.l1)) {
          layers.push(...layersParse12(parameters.l1, config));
        }
        layers = uniqBy(layers, (layer) => {
          let str = '';
          CUSTOM_PALETTE_TYPE_ARRAY.forEach((element) => {
            str += layer[element] ? layer[element][0] : '';
          });
          return layer.id + str;
        });
      }
      const legacyState = parse(parameters, config, errors);
      adjustStartDates(config.layers);

      // handle extending active layer date ranges
      adjustActiveDateRanges(config.layers, pageLoadTime);

      // handle add mock future time to provided layer id
      if (parameters.mockFutureLayer) {
        mockFutureTimeLayerOptions(config.layers, parameters.mockFutureLayer);
      }
      adjustEndDates(config.layers);
      // Remove any mock stories
      if (!parameters.mockTour) {
        Object.keys(config.stories).forEach((storyId) => {
          if (config.stories[storyId].isMock) {
            delete config.stories[storyId];
            config.storyOrder = config.storyOrder.filter((id) => id !== storyId);
          }
        });
      }
      preloadPalettes(layers, {}, false).then((obj) => {
        config.palettes = {
          custom: obj.custom,
          rendered: obj.rendered,
        };
        render(config, parameters, legacyState);
      });
    }).catch((error) => console.error(error));
};

export default history;
