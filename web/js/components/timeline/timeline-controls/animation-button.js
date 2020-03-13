import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVideo } from '@fortawesome/free-solid-svg-icons';

class AnimationButton extends PureComponent {
  render() {
    const className = 'button-action-group animate-button';
    return (
      <div
        className={
          this.props.disabled ? `wv-disabled-button ${className}` : className
        }
        title={this.props.title ? this.props.title : 'Set up animation'}
      >
        <div id="animate-button" onClick={this.props.clickAnimationButton}>
          <FontAwesomeIcon icon={faVideo} className="wv-animate" size="3x" />
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
