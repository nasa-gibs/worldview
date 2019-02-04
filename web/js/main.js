import 'babel-polyfill'; // Needed for worldview-components in IE and older browsers
import React from 'react';
import ReactDOM from 'react-dom';
import App from './app';
import { Provider } from 'react-redux';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import { modalReducer, modalAboutPage } from './modules/modal/reducers';
import legacyReducer from './modules/migration/reducers';
import feedbackReducer from './modules/feedback/reducers';
import projectionReducer from './modules/projection/reducer';
import { shortLink, linkReducer } from './modules/link/reducers';
import thunk from 'redux-thunk';

const reducers = {
  projection: projectionReducer,
  modal: modalReducer,
  legacy: legacyReducer,
  feedback: feedbackReducer,
  link: linkReducer,
  modalAboutPage,
  shortLink
};

const store = createStore(combineReducers(reducers), applyMiddleware(thunk));

// Document ready function
window.onload = () => {
  ReactDOM.render(
    <Provider store={store}>
      <App />
    </Provider>,
    document.getElementById('app')
  );
};
