import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, ButtonGroup } from 'reactstrap';
import HoverTooltip from '../util/hover-tooltip';
import TemperatureUnitButtons from './temperature-unit-buttons';
import CoordinateFormatButtons from './coordinate-format-buttons';
import {
  changeTemperatureUnit,
  changeDatelineVisibility,
  changeCoordinateFormat,
} from '../../modules/settings/actions';

function GlobalSettings(props) {
  const {
    alwaysShowDatelines,
    toggleAlwaysShowDatelines,
    changeTemperatureUnitAction,
    globalTemperatureUnit,
    changeCoordinateFormatAction,
    coordinateFormat,
  } = props;

  return (
    <div className="global-setting-container">

      <TemperatureUnitButtons
        changeTemperatureUnit={changeTemperatureUnitAction}
        globalTemperatureUnit={globalTemperatureUnit}
      />

      <CoordinateFormatButtons
        changeCoordinateFormat={changeCoordinateFormatAction}
        coordinateFormat={coordinateFormat}
      />

      <div className="settings-component">
        <h3 className="wv-header">
          Show Antimeridian / Approximate Date Line
          {' '}
          <span><FontAwesomeIcon id="datelines-toggle" icon="info-circle" /></span>
          <HoverTooltip
            isMobile={false}
            labelText="For many layers, this line represents the transition of daytime imagery from one day to the next."
            target="datelines-toggle"
            placement="right"
          />
        </h3>
        <ButtonGroup>
          <Button
            outline
            className="setting-button"
            active={alwaysShowDatelines}
            onClick={() => toggleAlwaysShowDatelines(true)}
          >
            Always
          </Button>
          <Button
            outline
            className="setting-button"
            active={!alwaysShowDatelines}
            onClick={() => toggleAlwaysShowDatelines(false)}
          >
            On Hover
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );
}

function mapStateToProps(state) {
  const { settings } = state;
  const { globalTemperatureUnit, alwaysShowDatelines, coordinateFormat } = settings;
  return {
    globalTemperatureUnit,
    alwaysShowDatelines,
    coordinateFormat,
  };
}

const mapDispatchToProps = (dispatch) => ({
  changeTemperatureUnitAction: (value) => {
    dispatch(changeTemperatureUnit(value));
  },
  toggleAlwaysShowDatelines: (value) => {
    dispatch(changeDatelineVisibility(value));
  },
  changeCoordinateFormatAction: (value) => {
    dispatch(changeCoordinateFormat(value));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(GlobalSettings);

GlobalSettings.propTypes = {
  alwaysShowDatelines: PropTypes.bool,
  toggleAlwaysShowDatelines: PropTypes.func,
  changeTemperatureUnitAction: PropTypes.func,
  globalTemperatureUnit: PropTypes.string,
  changeCoordinateFormatAction: PropTypes.func,
  coordinateFormat: PropTypes.string,
};
