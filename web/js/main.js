/* global DEBUG */
// IE11 corejs polyfills container
import 'core-js/stable';
import 'regenerator-runtime/runtime';
// IE11 corejs polyfills container
import 'whatwg-fetch';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware, compose } from 'redux';
import { responsiveStoreEnhancer } from 'redux-responsive';
import {
  createReduxLocationActions,
  listenForHistoryChange,
} from 'redux-location-state';
import { createBrowserHistory } from 'history';
import { uniqBy } from 'lodash';
import { getMiddleware } from './combine-middleware';
import { mapLocationToState, getParamObject } from './location';
import { stateToParams } from './redux-location-state-customs';
import reducers, { getInitialState } from './modules/combine-reducers';
import App from './app';
import util from './util/util';
import loadingIndicator from './ui/indicator';
import Brand from './brand';
import { combineModels } from './combine-models';
import { parse } from './parse';
import { combineUi } from './combine-ui';
import { preloadPalettes, hasCustomTypePalette } from './modules/palettes/util';
import {
  validate as layerValidate,
  layersParse12,
} from './modules/layers/util';
import { polyfill } from './polyfill';
import { debugConfig } from './debug';
import { CUSTOM_PALETTE_TYPE_ARRAY } from './modules/palettes/constants';

export const history = createBrowserHistory();

const isDebugMode = typeof DEBUG !== 'undefined';
const configURI = Brand.url('config/wv.json');
const startTime = new Date().getTime();
// Code for when version of redux dev-tools plugin stops crashing
// const compose = isDebugMode
//   ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({ latency: 0 }) ||
//     defaultCompose
//   : defaultCompose;
const parameters = util.fromQueryString(window.location.search);
let { elapsed } = util;
const errors = [];
// Document ready function
window.onload = () => {
  if (!parameters.elapsed) {
    elapsed = function() {};
  }
  polyfill();
  elapsed('loading config', startTime, parameters);
  const promise = $.getJSON(configURI);

  loadingIndicator.delayed(promise, 1000);
  promise
    .done((config) => {
      config.pageLoadTime = parameters.now
        ? util.parseDateUTC(parameters.now) || new Date()
        : new Date();

      config.initialDate = config.pageLoadTime.getUTCHours() < 3
        ? new Date((config.pageLoadTime).setUTCDate(config.pageLoadTime.getUTCDate() - 1))
        : config.pageLoadTime;

      config.todaysDate = new Date().getUTCHours() < 3
        ? new Date((new Date()).setUTCDate(new Date().getUTCDate() - 1))
        : new Date();

      config.palettes = {
        rendered: {},
        custom: {},
      };

      elapsed('Config loaded', config.now, parameters);
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
      layerValidate(errors, config);
      preloadPalettes(layers, {}, false).then((obj) => {
        config.palettes = {
          custom: obj.custom,
          rendered: obj.rendered,
        };
        render(config, parameters, legacyState);
      });
    })
    .fail(util.error);
};

const render = (config, parameters, legacyState) => {
  config.parameters = parameters;
  debugConfig(config);
  const models = combineModels(config, legacyState); // Get legacy models

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
  const middleware = getMiddleware(isDebugMode, locationMiddleware); // Get Various Middlewares
  const store = createStore(
    reducersWithLocation,
    getInitialState(models, config, parameters),
    compose(
      applyMiddleware(...middleware),
      responsiveStoreEnhancer,
    ),
  );
  listenForHistoryChange(store, history);
  elapsed('Render', startTime, parameters);

  const mouseMoveEvents = util.events();

  ReactDOM.render(
    <Provider store={store}>
      <App models={models} mapMouseEvents={mouseMoveEvents} />
    </Provider>,
    document.getElementById('app'),
  );

  combineUi(models, config, mouseMoveEvents, store); // Legacy UI
  util.errorReport(errors);
};
