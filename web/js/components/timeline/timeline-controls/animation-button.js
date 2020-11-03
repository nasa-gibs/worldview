import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

class AnimationButton extends PureComponent {
  render() {
    const className = 'button-action-group animate-button';
    const { disabled, title, clickAnimationButton } = this.props;
    return (
      <div
        className={disabled ? `wv-disabled-button ${className}` : className}
        title={title || 'Set up animation'}
      >
        <div id="animate-button" onClick={clickAnimationButton}>
          <FontAwesomeIcon icon="video" className="wv-animate" size="3x" />
        </div>
      </div>
    );
  }
}

AnimationButton.propTypes = {
  clickAnimationButton: PropTypes.func,
  disabled: PropTypes.bool,
  title: PropTypes.string,
};

export default AnimationButton;
