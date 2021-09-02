import React from 'react';
import PropTypes from 'prop-types';
import { Button, ButtonGroup } from 'reactstrap';
import { TEMPERATURE_UNITS } from '../../modules/global-unit/constants';

const TemperatureUnitButtons = ({ globalTemperatureUnit, changeTemperatureUnit }) => (
  <div className="temperature-unit-buttons settings-component">
    <h3 className="wv-header">Temperature Unit</h3>
    <ButtonGroup>
      {TEMPERATURE_UNITS.map((unit) => (
        <Button
          key={`${unit}-button`}
          aria-label={`Set ${unit} Unit`}
          outline
          className="temperature-unit-button"
          active={globalTemperatureUnit === unit}
          onClick={() => changeTemperatureUnit(unit)}
        >
          {unit}
        </Button>
      ))}
      <Button
        aria-label="Reset to Default Unit"
        outline
        className="temperature-unit-button"
        active={!globalTemperatureUnit}
        onClick={() => changeTemperatureUnit('')}
      >
        Defaults
      </Button>
    </ButtonGroup>
  </div>
);

TemperatureUnitButtons.propTypes = {
  globalTemperatureUnit: PropTypes.string,
  changeTemperatureUnit: PropTypes.func,
};

export default TemperatureUnitButtons;
