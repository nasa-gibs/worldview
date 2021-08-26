import React from 'react';
import PropTypes from 'prop-types';
import { Button, ButtonGroup } from 'reactstrap';

const TemperatureUnitButtons = ({ globalTemperatureUnit, changeTemperatureUnit }) => (
  <div className="temperature-unit-buttons settings-component">
    <h3 className="wv-header">Temperature Unit</h3>
    <ButtonGroup>
      <Button
        aria-label="Set Kelvin Unit"
        outline
        className="temperature-unit-button"
        active={globalTemperatureUnit === 'Kelvin'}
        onClick={() => changeTemperatureUnit('Kelvin')}
      >
        Kelvin
      </Button>
      <Button
        aria-label="Set Celsius Unit"
        outline
        className="temperature-unit-button"
        active={globalTemperatureUnit === 'Celsius'}
        onClick={() => changeTemperatureUnit('Celsius')}
      >
        Celsius
      </Button>
      <Button
        aria-label="Set Fahrenheit Unit"
        outline
        className="temperature-unit-button"
        active={globalTemperatureUnit === 'Fahrenheit'}
        onClick={() => changeTemperatureUnit('Fahrenheit')}
      >
        Fahrenheit
      </Button>
      <Button
        aria-label="Reset to Default Unit"
        outline
        className="temperature-unit-button"
        active={!globalTemperatureUnit}
        onClick={() => changeTemperatureUnit('')}
      >
        Default
      </Button>
    </ButtonGroup>
  </div>
);

TemperatureUnitButtons.propTypes = {
  globalTemperatureUnit: PropTypes.string,
  changeTemperatureUnit: PropTypes.func,
};

export default TemperatureUnitButtons;
