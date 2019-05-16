import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

class AnimationButton extends PureComponent {
  render() {
    return (
      <div
        className="button-action-group animate-button"
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
