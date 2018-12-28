import 'babel-polyfill'; // Needed for worldview-components in IE and older browsers
import React from 'react';
import ReactDOM from 'react-dom';
import App from './app';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import modalReducer from './modules/modal/reducer';
const store = createStore(modalReducer);

// Document ready function
window.onload = () => {
  ReactDOM.render(
    <Provider store={store}>
      <App />
    </Provider>,
    document.getElementById('app')
  );
};
