import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

class AnimationButton extends PureComponent {
  render() {
    const className = 'button-action-group animate-button';
    return (
      <div
        className={
          this.props.disabled ? 'wv-disabled-button ' + className : className
        }
        title={this.props.title ? this.props.title : 'Set up animation'}
      >
        <div id="animate-button" onClick={this.props.clickAnimationButton}>
          <i className="fas fa-video wv-animate" />
        </div>
      </div>
    );
  }
}

AnimationButton.propTypes = {
  clickAnimationButton: PropTypes.func,
  disabled: PropTypes.bool
};

export default AnimationButton;
