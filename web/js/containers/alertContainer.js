import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
} from 'reactstrap';
import FeatureAlert from '../components/feature-alert/alert';
import Alerts from './alerts';
import Tour from './tour';

export default function AlertContainer(isTourActive, numberOutagesUnseen, isMobile, isEmbedModeActive) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggle = () => setDropdownOpen((prevState) => !prevState);

  return (
    <Dropdown group isOpen={dropdownOpen} toggle={toggle} className="wv-alert-dropdown">
      <DropdownToggle caret>
        <FontAwesomeIcon
          icon="exclamation-triangle"
          className="wv-alert-icon"
          size="1x"
        />
        Multiple Layer Alerts
      </DropdownToggle>
      <DropdownMenu id="wv-alert-container" className="wv-alert-container">
        <FeatureAlert />
        <Alerts />
        {isTourActive && numberOutagesUnseen === 0 && (!isMobile || isEmbedModeActive) ? <Tour /> : null}
      </DropdownMenu>
    </Dropdown>
  );
}
