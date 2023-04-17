// this component is not currently being used but can be used for debugging by rendering in gloabal-settings.js
import React from 'react';
import { Button, ButtonGroup, UncontrolledTooltip } from 'reactstrap';
import { useSelector, useDispatch } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import toggleDistractionFreeModeAction, {
  toggleKioskMode as toggleKioskModeAction,
} from '../../modules/ui/actions';

function KioskModeButtons () {
  const dispatch = useDispatch();
  const toggleKioskMode = (kioskIsActive) => { dispatch(toggleKioskModeAction(kioskIsActive)); };
  const toggleDistractionFreeMode = () => { dispatch(toggleDistractionFreeModeAction()); };

  const { isKioskModeActive, isDistractionFreeModeActive } = useSelector((state) => ({
    isKioskModeActive: state.ui.isKioskModeActive,
    isDistractionFreeModeActive: state.ui.isDistractionFreeModeActive,
  }));

  const handleButtonSelect = (kioskIsActive, distractionFree) => {
    if (!distractionFree) {
      toggleKioskMode(kioskIsActive);
    } else {
      toggleKioskMode(kioskIsActive);
      toggleDistractionFreeMode(distractionFree);
    }
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
          onClick={() => handleButtonSelect(true, false)}
        >
          Kiosk Mode Only
        </Button>
        <Button
          aria-label="Kiosk mode & distraction free mode on"
          outline
          className="setting-button"
          active={isKioskModeActive && isDistractionFreeModeActive}
          onClick={() => handleButtonSelect(true, true)}
        >
          Kiosk & Distraction Free
        </Button>
        <Button
          aria-label="Kiosk mode off"
          outline
          className="setting-button"
          active={!isKioskModeActive}
          onClick={() => handleButtonSelect(false, false)}
        >
          OFF
        </Button>
      </ButtonGroup>
    </div>
  );
}

export default KioskModeButtons;
