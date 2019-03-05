import 'babel-polyfill'; // Needed for worldview-components in IE and older browsers
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import { each as lodashEach, debounce as lodashDebounce } from 'lodash';
import { getMiddleware } from './redux-config-helpers';
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
import { updatePermalink } from './modules/link/actions';
import { combineUi } from './combine-ui';
import palettes from './palettes/palettes';
import { updateLegacyModule } from './modules/migration/actions';

const isDevelop = !!(
  process &&
  process.env &&
  process.env.NODE_ENV === 'development'
);
let parameters = util.fromQueryString(location.search);
const configURI = Brand.url('config/wv.json');
const startTime = new Date().getTime();

let elapsed = util.elapsed;

// Document ready function
window.onload = () => {
  if (!parameters.elapsed) {
    elapsed = function() {};
  }
  elapsed('loading config', startTime, parameters);
  var promise = $.getJSON(configURI);

  loadingIndicator.delayed(promise, 1000);
  promise
    .done(config => {
      elapsed('Config loaded', startTime, parameters);
      let legacyState = parse(parameters, config);
      let requirements = [palettes.requirements(legacyState, config, true)];
      $.when
        .apply(null, requirements)
        .then(() => render(config, parameters, legacyState));
    })
    .fail(util.error);
};

const render = (config, parameters, legacyState) => {
  config.parameters = parameters;
  let models = combineModels(config, legacyState);

  const paramSetup = getParamObject(parameters, config, models, legacyState);
  let errors = [];
  const history = createBrowserHistory();

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
  const middleware = getMiddleware(isDevelop, locationMiddleware);
  const store = createStore(
    reducersWithLocation,
    getInitialState(models, config, parameters),
    applyMiddleware(...middleware)
  );
  lodashEach(models, function(component, i) {
    if (component.load && !component.loaded) {
      component.load(legacyState, errors);
    }
    const dispatchUpdate = lodashDebounce(() => {
      store.dispatch(updateLegacyModule(i, component));
    }, 100);
    // replace link register
    component.events.any(dispatchUpdate);
  });

  let queryString = '';
  history.listen((location, action) => {
    const newString = location.search;
    if (queryString !== newString) {
      queryString = newString;
      store.dispatch(updatePermalink(queryString));
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
  combineUi(models, config, mouseMoveEvents);
};
