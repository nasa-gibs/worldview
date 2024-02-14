import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import FeatureAlert from '../components/feature-alert/alert';
import Alerts from './alerts';

export default function AlertDropdown(isTourActive) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef(null);
  const notifications = containerRef?.current?.children.length;
  const toggle = () => setDropdownOpen((prevState) => !prevState);
  const { isTourActive: tourActive } = isTourActive;

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
      <div ref={containerRef} hidden={!(dropdownOpen || notifications === 1) || tourActive} id="wv-alert-container" className="wv-alert-container">
        <FeatureAlert />
        <Alerts />
      </div>
    </div>
  );
}
