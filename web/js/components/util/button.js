import React from 'react';
import PropTypes from 'prop-types';

/*
 * A react component, Builds a rather specific
 * interactive widget
 *
 * @class AnimationWidget
 * @extends React.Component
 */
export default class Button extends React.Component {
  render() {
    return (
      <button
        onClick={this.props.onClick}
        onMouseDown={e => e.stopPropagation()}
        style={this.props.style}
        id={this.props.id}
        disabled={!this.props.valid}
        className={
          this.props.valid
            ? 'wv-button ' + this.props.className
            : 'wv-disabled wv-button ' + this.props.className
        }
      >
        <span className="button-text">{this.props.text}</span>
      </button>
    );
  }
}

Button.defaultProps = {
  className: 'gray',
  valid: true,
  id: '',
  style: null
};
Button.propTypes = {
  onClick: PropTypes.func,
  style: PropTypes.object,
  id: PropTypes.string,
  valid: PropTypes.bool,
  className: PropTypes.string,
  text: PropTypes.string
};
