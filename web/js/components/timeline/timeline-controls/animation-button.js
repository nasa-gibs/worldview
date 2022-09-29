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
    isLandscape,
    isPortrait,
    isMobilePhone,
    isMobileTablet,
    hasSubdailyLayers,
  } = props;

  const subdailyID = hasSubdailyLayers ? '-subdaily' : ''
  const buttonId = 'animate-button';
  const labelText = label || 'Set up animation';
  const className = isMobilePhone && isPortrait || !isMobileTablet && screenWidth < breakpoints.extraSmall ? `mobile-animate-button animate-button-phone-portrait${subdailyID}`
    : isMobilePhone && isLandscape ? `mobile-animate-button animate-button-phone-landscape${subdailyID}`
      : isMobileTablet && isPortrait || !isMobilePhone && screenWidth < breakpoints.small ? `mobile-animate-button animate-button-tablet-portrait${subdailyID}`
        : isMobileTablet && isLandscape ? `mobile-animate-button animate-button-tablet-landscape${subdailyID}`
          : ' animate-button'

  return (
    <div
      onClick={clickAnimationButton}
      className={disabled ? `wv-disabled-button button-action-group ${className}` : `button-action-group ${className}`}
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
