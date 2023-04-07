import React from 'react';
import { Button, ButtonGroup, UncontrolledTooltip } from 'reactstrap';
import { useSelector, useDispatch } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toggleKioskMode as toggleKioskModeAction } from '../../modules/ui/actions';

function KioskModeButtons () {
  const dispatch = useDispatch();
  const toggleKioskMode = (isActive) => { dispatch(toggleKioskModeAction(isActive)); };

  const { isKioskModeActive } = useSelector((state) => ({
    isKioskModeActive: state.ui.isKioskModeActive,
  }));

  const handleButtonSelect = (isActive) => {
    if (isActive && isKioskModeActive) return;
    if (!isActive && !isKioskModeActive) return;
    toggleKioskMode(isActive);
  };

  const headerText = 'Kiosk Mode  ';
  const labelText = 'Kiosk mode will only display the most current date with available imagery';
  return (
    <div className="settings-component">
      <h3 className="wv-header">
        {headerText}
        <span><FontAwesomeIcon id="kiosk-mode-buttons-info-icon" icon="info-circle" /></span>
        <UncontrolledTooltip
          id="kiosk-setting-tooltip"
          target="kiosk-mode-buttons-info-icon"
          placement="right"
        >
          {labelText}
        </UncontrolledTooltip>
      </h3>
      <ButtonGroup>
        <Button
          aria-label="Kiosk mode on"
          outline
          className="setting-button"
          active={isKioskModeActive}
          onClick={() => handleButtonSelect(true)}
        >
          ON
        </Button>
        <Button
          aria-label="Kiosk mode off"
          outline
          className="setting-button"
          active={!isKioskModeActive}
          onClick={() => handleButtonSelect(false)}
        >
          OFF
        </Button>
      </ButtonGroup>
    </div>
  );
}

export default KioskModeButtons;
