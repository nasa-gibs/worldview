import React from 'react';
import PropTypes from 'prop-types';
import { Button, ButtonGroup, UncontrolledTooltip } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { COORDINATE_FORMATS } from '../../modules/settings/constants';

function CoordinateFormatButtons ({ changeCoordinateFormat, coordinateFormat }) {
  const coordinateMenuOptions = ['DD', 'DDM', 'DMS'];
  const labelText = 'Applied to all on screen coordinates';

  return (
    <div className="settings-component">
      <h3 className="wv-header">
        Coordinate Format (latitude, longitude)
        {' '}
        <span><FontAwesomeIcon id="coordinate-format-buttons-info-icon" icon="info-circle" /></span>
        <UncontrolledTooltip
          id="coordinate-setting-tooltip"
          target="coordinate-format-buttons-info-icon"
          placement="right"
        >
          {labelText}
        </UncontrolledTooltip>
      </h3>
      <ButtonGroup>
        {COORDINATE_FORMATS.map((format, i) => (
          <Button
            key={`${format}-button`}
            aria-label={`Set ${format} Format`}
            outline
            className="setting-button"
            active={coordinateFormat === format}
            onClick={() => changeCoordinateFormat(format)}
            id={`${format}-btn`}
          >
            {coordinateMenuOptions[i]}
          </Button>
        ))}
      </ButtonGroup>
    </div>
  );
}

CoordinateFormatButtons.propTypes = {
  changeCoordinateFormat: PropTypes.func,
  coordinateFormat: PropTypes.string,
};

export default CoordinateFormatButtons;
