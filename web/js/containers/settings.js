import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  toggleInfiniteWrap, toggleOverviewMap, toggleDatelines, toggleDayNightMode,
} from '../modules/settings/actions';
import Switch from '../components/util/switch';

class Settings extends Component {
  getListArray() {
    const {
      isInfinite,
      toggleInfinite,
      toggleOverview,
      hasOverview,
      hasVisibleDatelines,
      toggleLines,
      toggleDayNight,
      isNightMode,
    } = this.props;

    return [
      {
        label: 'Infinite Scroll',
        id: 'infinite-settings-item',
        active: isInfinite,
        toggle: toggleInfinite,
      },
      {
        label: 'Day / Night',
        id: 'day-night-settings-item',
        active: isNightMode,
        toggle: toggleDayNight,
      },
      {
        label: 'Show Datelines',
        id: 'show-dateline-settings-item',
        active: hasVisibleDatelines,
        toggle: toggleLines,
      },
      {
        label: 'Show Map Overview',
        id: 'show-mapoverview-settings-item',
        active: hasOverview,
        toggle: toggleOverview,
      },
    ];
  }

  render() {
    const settingsToggleList = this.getListArray();
    return settingsToggleList.map((itemProps) => (
      <Switch key={itemProps.id} {...itemProps} /> // eslint-disable-line react/jsx-props-no-spreading
    ));
  }
}

function mapStateToProps(state) {
  const { settings, browser } = state;
  const {
    isInfinite, hasOverview, hasVisibleDatelines, isNightMode,
  } = settings;

  return {
    isInfinite,
    isMobile: browser.lessThan.medium,
    hasOverview,
    hasVisibleDatelines,
    isNightMode,
  };
}
const mapDispatchToProps = (dispatch) => ({
  toggleInfinite: () => {
    dispatch(toggleInfiniteWrap());
  },
  toggleOverview: () => {
    dispatch(toggleOverviewMap());
  },
  toggleLines: () => {
    dispatch(toggleDatelines());
  },
  toggleDayNight: () => {
    dispatch(toggleDayNightMode());
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Settings);

Settings.propTypes = {
  isInfinite: PropTypes.bool,
  toggleInfinite: PropTypes.func,
  toggleOverview: PropTypes.func,
  isShowOverviewMap: PropTypes.bool,
  hasOverview: PropTypes.bool,
  hasVisibleDatelines: PropTypes.bool,
  toggleLines: PropTypes.func,
  toggleDayNight: PropTypes.func,
  isNightMode: PropTypes.bool,
};
