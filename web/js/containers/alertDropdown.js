import React, { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import FeatureAlert from '../components/feature-alert/alert';
import Alerts from './alerts';

export default function AlertDropdown(isTourActive) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef(null);
  const notifications = containerRef?.current?.children.length;
  const toggle = () => setDropdownOpen((prevState) => !prevState);
  const { isTourActive: tourActive } = isTourActive;
  const isDistractionFreeModeActive = useSelector((state) => state.ui.isDistractionFreeModeActive);
  const isMobile = useSelector((state) => state.screenSize.isMobileDevice);

  return (
    <div className="wv-alert-dropdown" hidden={isDistractionFreeModeActive || tourActive || isMobile}>
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
      </div>
      <div className="wv-alert-footer" hidden={!dropdownOpen || notifications <= 1}>
        <em>Select an issue above for details</em>
      </div>
    </div>
  );
}
