import React from 'react';
import PropTypes from 'prop-types';

/*
 * @class Button
 * @extends React.Component
 */
export default class Button extends React.Component {
  render() {
    return (
      <button
        onClick={this.props.onClick}
        onMouseDown={(e) => e.stopPropagation()}
        style={this.props.style}
        id={this.props.id}
        disabled={!this.props.valid}
        className={
          this.props.valid
            ? `wv-button ${this.props.className}`
            : `wv-disabled wv-button ${this.props.className}`
        }
      >
        <span className="button-text">{this.props.text}</span>
      </button>
    );
  }
}

Button.defaultProps = {
  className: 'gray',
  id: '',
  style: null,
  valid: true,
};
Button.propTypes = {
  className: PropTypes.string,
  id: PropTypes.string,
  onClick: PropTypes.func,
  style: PropTypes.object,
  text: PropTypes.string,
  valid: PropTypes.bool,
};
