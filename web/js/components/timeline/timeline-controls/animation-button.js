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
        id="animate-button"
        title="Set up animation"
        onClick={this.props.clickAnimationButton}
      >
        <i id="wv-animate" className="fas fa-video wv-animate" />
      </div>
    );
  }
}

AnimationButton.propTypes = {
  clickAnimationButton: PropTypes.func
};

export default AnimationButton;
