/* global DEBUG */
import 'babel-polyfill'; // Needed for worldview-components in IE and older browsers
import 'whatwg-fetch';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware, compose } from 'redux';
import { each as lodashEach, debounce as lodashDebounce } from 'lodash';
import { responsiveStoreEnhancer } from 'redux-responsive';
import { getMiddleware } from './combine-middleware';
import {
  createReduxLocationActions,
  listenForHistoryChange
} from 'redux-location-state';
import { mapLocationToState, getParamObject } from './location';
import { stateToParams } from './redux-location-state-customs';
import createBrowserHistory from 'history/createBrowserHistory';
import reducers, { getInitialState } from './modules/combine-reducers';
import App from './app';
import util from './util/util';
import loadingIndicator from './ui/indicator';
import Brand from './brand';
import { combineModels } from './combine-models';
import { parse } from './parse';
import { combineUi } from './combine-ui';
import palettes from './palettes/palettes';
import { updateLegacyModule } from './modules/migration/actions';
import { validate as layerValidate } from './layers/layers';
import { polyfill } from './polyfill';
import { debugConfig } from './debug';
import { changeProjection } from './modules/projection/actions';

export const history = createBrowserHistory();
const isDebugMode = typeof DEBUG !== 'undefined';
const configURI = Brand.url('config/wv.json');
const startTime = new Date().getTime();
let parameters = util.fromQueryString(location.search);
let elapsed = util.elapsed;
let errors = [];

// Document ready function
window.onload = () => {
  if (!parameters.elapsed) {
    elapsed = function() {};
  }
  polyfill();
  elapsed('loading config', startTime, parameters);
  var promise = $.getJSON(configURI);

  loadingIndicator.delayed(promise, 1000);
  promise
    .done(config => {
      elapsed('Config loaded', startTime, parameters);
      let legacyState = parse(parameters, config, errors);
      layerValidate(errors, config);
      let requirements = [palettes.requirements(legacyState, config, true)];
      $.when
        .apply(null, requirements)
        .then(() => util.wrap(render(config, parameters, legacyState))); // Wrap render up
    })
    .fail(util.error);
};

const render = (config, parameters, legacyState) => {
  config.parameters = parameters;
  debugConfig(config);
  let models = combineModels(config, legacyState); // Get legacy models

  // Get Permalink parse/serializers
  const paramSetup = getParamObject(
    parameters,
    config,
    models,
    legacyState,
    errors
  );

  const {
    locationMiddleware,
    reducersWithLocation
  } = createReduxLocationActions(
    paramSetup,
    mapLocationToState,
    history,
    reducers,
    stateToParams
  );
  const middleware = getMiddleware(isDebugMode, locationMiddleware); // Get Various Middlewares
  const store = createStore(
    reducersWithLocation,
    getInitialState(models, config, parameters),
    compose(
      responsiveStoreEnhancer,
      applyMiddleware(...middleware)
    )
  );
  lodashEach(models, function(component, key) {
    if (component.load && !component.loaded) {
      component.load(legacyState, errors);
    }
    const dispatchUpdate = lodashDebounce(() => {
      store.dispatch(updateLegacyModule(key, component));
    }, 100);
    // sync old and new state
    component.events.any(dispatchUpdate);
  });
  // Big HACKY sync up of proj state
  models.proj.events.on('select', (projObj, id) => {
    const state = store.getState();
    if (state.proj.id !== id) {
      store.dispatch(changeProjection(id, config));
    }
  });
  listenForHistoryChange(store, history);
  elapsed('Render', startTime, parameters);

  let mouseMoveEvents = util.events();

  ReactDOM.render(
    <Provider store={store}>
      <App models={models} mapMouseEvents={mouseMoveEvents} />
    </Provider>,
    document.getElementById('app')
  );

  combineUi(models, config, mouseMoveEvents); // Legacy UI
  util.errorReport(errors);
};
