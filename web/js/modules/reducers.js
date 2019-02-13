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

const reducers = {
  projection: projectionReducer,
  modal: modalReducer,
  legacy: legacyReducer,
  feedback: feedbackReducer,
  link: linkReducer,
  notifications: notificationsReducer,
  modalAboutPage,
  shortLink,
  notificationsRequest
};

export default combineReducers(reducers);
