import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import LocationSearchModal from './location-search-modal';
import {
  toggleShowLocationSearch,
} from '../../modules/location-search/actions';
import { isLocationSearchFeatureEnabled } from '../../modules/location-search/util';

class LocationSearch extends Component {
  constructor(props) {
    super(props);
    this.state = {
      inputValue: '',
      coordinatesPending: [],
    };
  }

  componentDidUpdate(prevProps) {
    const { isExpanded, isMobile, toggleShowLocationSearch } = this.props;
    if (isExpanded && prevProps.isMobile !== isMobile) {
      toggleShowLocationSearch();
    }
  }

  // update input value
  updateValue = (inputValue) => this.setState({ inputValue });

  // update array of pending coordinates
  updatePendingCoordinates = (coordinatesPending) => this.setState({ coordinatesPending });

  renderSearchComponent = () => {
    const {
      coordinatesPending,
      inputValue,
    } = this.state;

    return (
      <LocationSearchModal
        coordinatesPending={coordinatesPending}
        inputValue={inputValue}
        updatePendingCoordinates={this.updatePendingCoordinates}
        updateValue={this.updateValue}
      />
    );
  };

  render() {
    const {
      isExpanded,
      isFeatureEnabled,
      isMobile,
      shouldCollapseFromOtherUI,
    } = this.props;
    if (!isFeatureEnabled) {
      return null;
    }

    const shouldShowComponent = isMobile || (isExpanded && !shouldCollapseFromOtherUI);
    return (
      <>
        {shouldShowComponent && this.renderSearchComponent()}
      </>
    );
  }
}

const mapStateToProps = (state) => {
  const {
    screenSize,
    config,
    modal,
    measure,
    animation,
    locationSearch,
    ui,
  } = state;
  const isFeatureEnabled = isLocationSearchFeatureEnabled(config);
  const { gifActive } = animation;
  const {
    isExpanded,
  } = locationSearch;
  const { isDistractionFreeModeActive } = ui;
  const isMobile = screenSize.isMobileDevice;
  const snapshotModalOpen = modal.isOpen && modal.id === 'TOOLBAR_SNAPSHOT';
  // Collapse when image download, GIF, measure tool, or distraction free mode is active
  const shouldCollapseFromOtherUI = snapshotModalOpen || measure.isActive || gifActive || isDistractionFreeModeActive;

  return {
    isExpanded,
    isFeatureEnabled,
    isMobile,
    shouldCollapseFromOtherUI,
  };
};

const mapDispatchToProps = (dispatch) => ({
  toggleShowLocationSearch: () => {
    dispatch(toggleShowLocationSearch());
  },
});

LocationSearch.propTypes = {
  isExpanded: PropTypes.bool,
  isFeatureEnabled: PropTypes.bool,
  isMobile: PropTypes.bool,
  shouldCollapseFromOtherUI: PropTypes.bool,
  toggleShowLocationSearch: PropTypes.func,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(LocationSearch);
