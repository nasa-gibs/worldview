import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import FeatureAlert from '../components/feature-alert/alert';
import Alerts from './alerts';
import Tour from './tour';

export default function AlertDropdown(isTourActive, numberOutagesUnseen, isMobile, isEmbedModeActive) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef(null);
  const notifications = containerRef?.current?.children.length;
  const toggle = () => setDropdownOpen((prevState) => !prevState);

  return (
    <div className="wv-alert-dropdown">
      <button type="button" hidden={notifications <= 1} onClick={toggle}>
        <FontAwesomeIcon
          icon="exclamation-triangle"
          className="wv-alert-icon"
          size="1x"
        />
        Multiple Layer Alerts
        {dropdownOpen ? <FontAwesomeIcon icon="fa-solid fa-caret-down" /> : <FontAwesomeIcon icon="fa-solid fa-caret-up" />}
      </button>
      <div ref={containerRef} hidden={!(dropdownOpen || notifications === 1)} id="wv-alert-container" className="wv-alert-container">
        <FeatureAlert />
        <Alerts />
        {isTourActive && numberOutagesUnseen === 0 && (!isMobile || isEmbedModeActive) ? <Tour /> : null}
      </div>
    </div>
  );
}
