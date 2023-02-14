import React from 'react';
import PropTypes from 'prop-types';
import { Button, ButtonGroup, UncontrolledTooltip } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { TEMPERATURE_UNITS } from '../../modules/settings/constants';

function TemperatureUnitButtons({ changeTemperatureUnit, globalTemperatureUnit }) {
  return (
    <div className="settings-component">
      <h3 className="wv-header">
        Temperature Unit
        {' '}
        <span><FontAwesomeIcon id="temperature-unit-buttons-info-icon" icon="info-circle" /></span>
        <UncontrolledTooltip
          id="temperature-setting-tooltip"
          target="temperature-unit-buttons-info-icon"
          placement="right"
        >
          Applied to relevant temperature layers
        </UncontrolledTooltip>
      </h3>
      <ButtonGroup>
        {TEMPERATURE_UNITS.map((unit) => (
          <Button
            key={`${unit}-button`}
            aria-label={`Set ${unit} Unit`}
            outline
            className="setting-button"
            active={globalTemperatureUnit === unit}
            onClick={() => changeTemperatureUnit(unit)}
          >
            {unit}
          </Button>
        ))}
        <Button
          aria-label="Reset to Default Unit"
          outline
          className="setting-button"
          active={!globalTemperatureUnit}
          onClick={() => changeTemperatureUnit('')}
        >
          Defaults
        </Button>
      </ButtonGroup>
    </div>
  );
}

TemperatureUnitButtons.propTypes = {
  changeTemperatureUnit: PropTypes.func,
  globalTemperatureUnit: PropTypes.string,
};

export default TemperatureUnitButtons;
