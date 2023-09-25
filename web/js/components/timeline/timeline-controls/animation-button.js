import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { UncontrolledTooltip } from 'reactstrap';

function AnimationButton(props) {
  const {
    disabled,
    label,
    clickAnimationButton,
    breakpoints,
    screenWidth,
    isKioskModeActive,
    isLandscape,
    isPortrait,
    isMobilePhone,
    isMobileTablet,
    isMobile,
    hasSubdailyLayers,
    isEmbedModeActive,
  } = props;

  const subdailyID = hasSubdailyLayers ? '-subdaily' : '';
  const buttonId = 'animate-button';
  const labelText = label || 'Set up animation';

  const getButtonClassName = () => {
    if (((isMobilePhone && isPortrait) || (!isMobileTablet && screenWidth < 670 && hasSubdailyLayers) || (!isMobileTablet && screenWidth < 575 && !hasSubdailyLayers)) && isEmbedModeActive) {
      return 'phone-portrait-embed';
    } if ((isMobilePhone && isPortrait) || (!isMobileTablet && screenWidth < 670 && hasSubdailyLayers) || (!isMobileTablet && screenWidth < 575 && !hasSubdailyLayers)) {
      return `phone-portrait${subdailyID}`;
    } if (isMobilePhone && isLandscape) {
      return `phone-landscape${subdailyID}`;
    } if (((isMobileTablet && isPortrait) || !isMobile || (!isMobilePhone && screenWidth < breakpoints.small)) && isEmbedModeActive) {
      return `tablet-portrait${subdailyID}-embed`;
    } if ((isMobileTablet && isPortrait) || (!isMobilePhone && screenWidth < breakpoints.small)) {
      return `tablet-portrait${subdailyID}`;
    } if (isMobileTablet && isLandscape) {
      return `tablet-landscape${subdailyID}`;
    }
  };

  const buttonClass = getButtonClassName();

  return (
    <div
      onClick={clickAnimationButton}
      className={isKioskModeActive ? 'd-none' : disabled ? 'wv-disabled-button button-action-group animate-button' : !isMobile && !isEmbedModeActive ? 'button-action-group animate-button' : `button-action-group mobile-animate-button animate-button-${buttonClass}`}
      aria-label={labelText}
    >
      <div id={buttonId}>
        {isMobile ? null
          : (
            <UncontrolledTooltip
              id="center-align-tooltip"
              placement="top"
              target={buttonId}
            >
              {labelText}
            </UncontrolledTooltip>
          )}
        <FontAwesomeIcon icon="video" className="wv-animate" size="2x" />
      </div>
    </div>
  );
}

AnimationButton.propTypes = {
  breakpoints: PropTypes.object,
  clickAnimationButton: PropTypes.func,
  disabled: PropTypes.bool,
  label: PropTypes.string,
  screenWidth: PropTypes.number,
  isKioskModeActive: PropTypes.bool,
  isLandscape: PropTypes.bool,
  isPortrait: PropTypes.bool,
  isMobilePhone: PropTypes.bool,
  isMobileTablet: PropTypes.bool,
  isMobile: PropTypes.bool,
  hasSubdailyLayers: PropTypes.bool,
  isEmbedModeActive: PropTypes.bool,
};

export default React.memo(AnimationButton);
