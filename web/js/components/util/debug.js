import React from 'react';
import PropTypes from 'prop-types';

/*
 * @class Debug
 * @extends React.Component
 */
export default class Debug extends React.Component {
  render() {
    if (this.props.parameters.showError) {
      throw new Error('this is a test error');
    }
    return '';
  }
}

Debug.propTypes = {
  parameters: PropTypes.object,
};
