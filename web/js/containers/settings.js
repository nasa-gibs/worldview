import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { toggleInfiniteWrap, toggleOverviewMap } from '../modules/settings/actions';
import Switch from '../components/util/switch';

class Settings extends Component {
  getListArray() {
    const {
      isInfinite,
      toggleInfinite,
      toggleOverview,
      hasOverview,
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
        active: false,
        toggle: () => {},
      },
      {
        label: 'Show Datelines',
        id: 'show-dateline-settings-item',
        active: false,
        toggle: () => {},
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
  const { isInfinite, hasOverview } = settings;
  return {
    isInfinite,
    isMobile: browser.lessThan.medium,
    hasOverview,
  };
}
const mapDispatchToProps = (dispatch) => ({
  toggleInfinite: () => {
    dispatch(toggleInfiniteWrap());
  },
  toggleOverview: () => {
    dispatch(toggleOverviewMap());
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
};
