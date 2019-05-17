import React from 'react';
import PropTypes from 'prop-types';

/*
 * A react component, Builds a rather specific
 * interactive widget
 *
 * @class AnimationWidget
 * @extends React.Component
 */
export default class debug extends React.Component {
  render() {
    if (this.props.parameters.showError) {
      throw new Error('this is a test error');
    }
    return '';
  }
}

debug.propTypes = {
  parameters: PropTypes.object
};
