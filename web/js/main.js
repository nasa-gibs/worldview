import 'babel-polyfill'; // Needed for worldview-components in IE and older browsers
import React from 'react';
import ReactDOM from 'react-dom';
import App from './app';
import { Provider } from 'react-redux';
import { createStore, combineReducers } from 'redux';
import modalReducer from './modules/modal/reducer';
import modelReducer from './modules/migration/reducer';
import projectionReducer from './modules/projection/reducer';

const reducers = {
  projection: projectionReducer,
  modal: modalReducer,
  models: modelReducer
};

const store = createStore(combineReducers(reducers));

// Document ready function
window.onload = () => {
  ReactDOM.render(
    <Provider store={store}>
      <App />
    </Provider>,
    document.getElementById('app')
  );
};
