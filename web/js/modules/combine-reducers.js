import { combineReducers } from 'redux';
import { createResponsiveStateReducer } from 'redux-responsive';
import { modalReducer, modalAboutPage } from './modal/reducers';
import legacyReducer from './migration/reducers';
import feedbackReducer from './feedback/reducers';
import projectionReducer from './projection/reducer';
import sidebarReducer from './sidebar/reducers';
import { shortLink, linkReducer } from './link/reducers';
import {
  notificationsRequest,
  notificationsReducer
} from './notifications/reducers';
import { getProjInitialState } from './projection/util';
import { compareReducer } from './compare/reducers';
import {
  layerReducer,
  getInitialState as getLayersInitialState
} from './layers/reducers';

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
      sreenHeight: window.innerHeight
    })
  }
);
export function getInitialState(models, config, parameters) {
  return {
    parameters,
    config,
    models,
    legacy: models,
    proj: getProjInitialState(config),
    layers: getLayersInitialState(config)
  };
}
const defaultReducer = (state = {}) => state;
const reducers = {
  proj: projectionReducer,
  modal: modalReducer,
  legacy: legacyReducer,
  feedback: feedbackReducer,
  link: linkReducer,
  notifications: notificationsReducer,
  config: defaultReducer,
  models: defaultReducer,
  parameters: defaultReducer,
  browser: responsiveStateReducer,
  sidebar: sidebarReducer,
  compare: compareReducer,
  layers: layerReducer,
  modalAboutPage,
  shortLink,
  notificationsRequest
};

export default combineReducers(reducers);
