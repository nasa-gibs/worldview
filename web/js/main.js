import 'babel-polyfill'; // Needed for worldview-components in IE and older browsers
import React from 'react';
import ReactDOM from 'react-dom';
import App from './app';

// Document ready function
window.onload = () => {
  ReactDOM.render(<App />, document.getElementById('app'));
};
