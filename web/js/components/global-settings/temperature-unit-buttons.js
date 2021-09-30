import React from 'react';
import PropTypes from 'prop-types';
import { Button, ButtonGroup } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import HoverTooltip from '../util/hover-tooltip';
import { TEMPERATURE_UNITS } from '../../modules/global-unit/constants';

const TemperatureUnitButtons = ({ changeTemperatureUnit, globalTemperatureUnit }) => (
  <div className="temperature-unit-buttons settings-component">
    <h3 className="wv-header">
      Temperature Unit
      {' '}
      <span><FontAwesomeIcon id="temperature-unit-buttons-info-icon" icon="info-circle" /></span>
      <HoverTooltip
        isMobile={false}
        labelText="Applied to all layers and metadata that use temperature"
        target="temperature-unit-buttons-info-icon"
        placement="right"
      />
    </h3>
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
  changeTemperatureUnit: PropTypes.func,
  globalTemperatureUnit: PropTypes.string,
};

export default TemperatureUnitButtons;
