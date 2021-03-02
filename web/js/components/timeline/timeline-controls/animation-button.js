import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { UncontrolledTooltip } from 'reactstrap';

class AnimationButton extends PureComponent {
  render() {
    const className = 'button-action-group animate-button';
    const { disabled, label, clickAnimationButton } = this.props;
    const buttonId = 'animate-button';
    const labelText = label || 'Set up animation';
    return (
      <div
        className={disabled ? `wv-disabled-button ${className}` : className}
        aria-label={labelText}
      >
        <div id={buttonId} onClick={clickAnimationButton}>
          <UncontrolledTooltip
            placement="top"
            target={buttonId}
          >
            {labelText}
          </UncontrolledTooltip>
          <FontAwesomeIcon icon="video" className="wv-animate" size="3x" />
        </div>
      </div>
    );
  }
}

AnimationButton.propTypes = {
  clickAnimationButton: PropTypes.func,
  disabled: PropTypes.bool,
  label: PropTypes.string,
};

export default AnimationButton;
