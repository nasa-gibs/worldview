import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import HoverTooltip from '../util/hover-tooltip';
import TemperatureUnitButtons from './temperature-unit-buttons';
import {
  changeTemperatureUnit,
  changeDatelineVisibility,
} from '../../modules/settings/actions';
import Switch from '../util/switch';

function GlobalSettings(props) {
  const {
    alwaysShowDatelines,
    toggleAlwaysShowDatelines,
    changeTemperatureUnitAction,
    globalTemperatureUnit,
  } = props;

  return (
    <>
      <div className="global-setting-container">

        <TemperatureUnitButtons
          changeTemperatureUnit={changeTemperatureUnitAction}
          globalTemperatureUnit={globalTemperatureUnit}
        />

        <div className="settings-component">
          <h3 className="wv-header">
            Show Datelines
            {' '}
            <span><FontAwesomeIcon id="datelines-toggle" icon="info-circle" /></span>
            <HoverTooltip
              isMobile={false}
              labelText="Either always show or only on mouse hover"
              target="datelines-toggle"
              placement="right"
            />
          </h3>
          <Switch
            id="dateline-visibility-toggle"
            label={alwaysShowDatelines ? 'Always' : 'On Hover'}
            containerClassAddition="header"
            active={alwaysShowDatelines}
            toggle={() => toggleAlwaysShowDatelines(!alwaysShowDatelines)}
          />
        </div>
      </div>
    </>
  );
}

function mapStateToProps(state) {
  const { settings } = state;
  const { globalTemperatureUnit, alwaysShowDatelines } = settings;
  return {
    globalTemperatureUnit,
    alwaysShowDatelines,
  };
}

const mapDispatchToProps = (dispatch) => ({
  changeTemperatureUnitAction: (value) => {
    dispatch(changeTemperatureUnit(value));
  },
  toggleAlwaysShowDatelines: (value) => {
    dispatch(changeDatelineVisibility(value));
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
};
