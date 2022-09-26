import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { UncontrolledTooltip } from 'reactstrap';

const AnimationButton = (props) => {
  const {
    disabled,
    label,
    clickAnimationButton,
    isMobile,
    breakpoints,
    screenWidth,
  } = props;

  const buttonId = 'animate-button';
  const labelText = label || 'Set up animation';
  const className = isMobile && screenWidth < breakpoints.small ? 'button-action-group mobile-animate-button animate-button-phone'
    : isMobile && screenWidth > breakpoints.small ? 'button-action-group mobile-animate-button animate-button-tablet'
      : 'button-action-group animate-button';

  return (
    <div
      onClick={clickAnimationButton}
      className={disabled ? `wv-disabled-button ${className}` : className}
      aria-label={labelText}
    >
      <div id={buttonId}>
        <UncontrolledTooltip
          placement="top"
          target={buttonId}
        >
          {labelText}
        </UncontrolledTooltip>
        <FontAwesomeIcon icon="video" className="wv-animate" size="2x" />
      </div>
    </div>
  );
};

AnimationButton.propTypes = {
  breakpoints: PropTypes.object,
  clickAnimationButton: PropTypes.func,
  disabled: PropTypes.bool,
  isMobile: PropTypes.bool,
  label: PropTypes.string,
  screenWidth: PropTypes.number,

};

export default React.memo(AnimationButton);
