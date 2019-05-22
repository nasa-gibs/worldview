import { combineReducers } from 'redux';
import { createResponsiveStateReducer } from 'redux-responsive';
import { modalReducer, modalAboutPage } from './modal/reducers';
import legacyReducer from './migration/reducers';
import feedbackReducer from './feedback/reducers';
import projectionReducer from './projection/reducer';
import { shortLink } from './link/reducers';
import {
  requestedEvents,
  requestedEventSources,
  requestedEventCategories,
  eventsReducer,
  eventRequestResponse
} from './natural-events/reducers';
import tourReducer from './tour/reducers';
import mapReducer from './map/reducers';
import {
  notificationsRequest,
  notificationsReducer
} from './notifications/reducers';
import { getProjInitialState } from './projection/util';
import { compareReducer } from './compare/reducers';
import sidebarReducer from './sidebar/reducers';
import {
  layerReducer,
  getInitialState as getLayersInitialState
} from './layers/reducers';
import { dateReducer } from './date/reducers';
import {
  animationReducer,
  getInitialState as getAnimationInitialState
} from './animation/reducers';
import { paletteReducer, getInitialPaletteState } from './palettes/reducers';
import dataDownloadReducer from './data/reducers';
import { get as lodashGet } from 'lodash';

function lastAction(state = null, action) {
  return action;
}
const responsiveStateReducer = createResponsiveStateReducer(
  {
    extraSmall: 500,
    small: 740,
    medium: 1000,
    large: 1280,
    extraLarge: 1400
  },
  {
    extraFields: () => ({
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight
    })
  }
);
export function getInitialState(models, config, parameters) {
  const eventsIgnoreArray = {
    ignore: lodashGet(config, 'naturalEvents.skip') || []
  };

  return {
    parameters,
    config,
    models,
    legacy: models,
    animation: getAnimationInitialState(config),
    proj: getProjInitialState(config),
    layers: getLayersInitialState(config),
    requestedEvents: eventRequestResponse(eventsIgnoreArray),
    requestedEventSources: eventRequestResponse(eventsIgnoreArray),
    requestedEventCategories: eventRequestResponse(eventsIgnoreArray),
    palettes: getInitialPaletteState(config)
  };
}
const defaultReducer = (state = {}) => state;
const reducers = {
  proj: projectionReducer,
  modal: modalReducer,
  legacy: legacyReducer,
  date: dateReducer,
  feedback: feedbackReducer,
  notifications: notificationsReducer,
  config: defaultReducer,
  models: defaultReducer,
  parameters: defaultReducer,
  browser: responsiveStateReducer,
  sidebar: sidebarReducer,
  compare: compareReducer,
  layers: layerReducer,
  events: eventsReducer,
  data: dataDownloadReducer,
  palettes: paletteReducer,
  tour: tourReducer,
  map: mapReducer,
  animation: animationReducer,
  requestedEvents,
  requestedEventSources,
  requestedEventCategories,
  modalAboutPage,
  shortLink,
  notificationsRequest,
  lastAction
};

export default combineReducers(reducers);
