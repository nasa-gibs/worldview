import { combineReducers } from 'redux';
import { modalReducer, modalAboutPage } from './modal/reducers';
import { createResponsiveStateReducer } from 'redux-responsive';
import legacyReducer from './migration/reducers';
import feedbackReducer from './feedback/reducers';
import projectionReducer from './projection/reducer';
import { shortLink } from './link/reducers';
import {
  notificationsRequest,
  notificationsReducer
} from './notifications/reducers';
import { getProjInitialState } from './projection/util';

export function getInitialState(models, config, parameters) {
  return {
    parameters,
    config,
    models,
    legacy: models,
    proj: getProjInitialState(config)
  };
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
const defaultReducer = (state = {}) => state;
const reducers = {
  proj: projectionReducer,
  modal: modalReducer,
  legacy: legacyReducer,
  feedback: feedbackReducer,
  notifications: notificationsReducer,
  config: defaultReducer,
  models: defaultReducer,
  parameters: defaultReducer,
  browser: responsiveStateReducer,
  modalAboutPage,
  shortLink,
  notificationsRequest
};

export default combineReducers(reducers);
