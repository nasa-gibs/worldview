import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { toggle as toggleInfiniteWrap } from '../modules/infinite-wrap/actions';
import Switch from '../components/util/switch';

class Settings extends Component {
  getListArray() {
    const {
      isInfinite,
      toggleInfinite,
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
  const { infiniteScroll, browser } = state;

  return {
    isInfinite: infiniteScroll.active,
    isMobile: browser.lessThan.medium,
  };
}
const mapDispatchToProps = (dispatch) => ({
  toggleInfinite: () => {
    dispatch(toggleInfiniteWrap());
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Settings);

Settings.propTypes = {
  isInfinite: PropTypes.bool,
  toggleInfinite: PropTypes.func,
};
