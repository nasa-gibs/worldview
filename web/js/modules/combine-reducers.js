import { combineReducers } from 'redux';
import { modalReducer, modalAboutPage } from './modal/reducers';
import legacyReducer from './migration/reducers';
import feedbackReducer from './feedback/reducers';
import projectionReducer from './projection/reducer';
import { shortLink, linkReducer } from './link/reducers';
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
  modalAboutPage,
  shortLink,
  notificationsRequest
};

export default combineReducers(reducers);
