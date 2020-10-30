import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
// import googleTagManager from 'googleTagManager';
import GeosearchModal from './geosearch-modal';
import {
  clearCoordinates,
  selectCoordinatesToFly,
  toggleShowGeosearch,
  toggleReverseGeocodeActive,
} from '../../modules/geosearch/actions';
import {
  areCoordinatesWithinExtent,
} from '../../modules/geosearch/selectors';

class Geosearch extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  componentDidUpdate(prevProps) {
    const { isExpanded, isMobile, toggleShowGeosearch } = this.props;
    if (isExpanded && prevProps.isMobile !== isMobile) {
      toggleShowGeosearch();
    }
  }

  renderSearchComponent = (isMobile) => {
    const {
      isCoordinatePairWithinExtent,
      clearCoordinates,
      coordinates,
      geosearchMobileModalOpen,
      isExpanded,
      selectCoordinatesToFly,
      toggleReverseGeocodeActive,
      toggleShowGeosearch,
    } = this.props;

    return (
      <GeosearchModal
        isCoordinatePairWithinExtent={isCoordinatePairWithinExtent}
        coordinates={coordinates}
        geosearchMobileModalOpen={geosearchMobileModalOpen}
        isExpanded={isExpanded}
        isMobile={isMobile}
        clearCoordinates={clearCoordinates}
        selectCoordinatesToFly={selectCoordinatesToFly}
        toggleReverseGeocodeActive={toggleReverseGeocodeActive}
        toggleShowGeosearch={toggleShowGeosearch}
      />
    );
  }

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

    const shouldShowComponent = isExpanded && !shouldCollapseFromOtherUI;
    return (
      <>
        {isMobile
          ? this.renderSearchComponent(true)
          : shouldShowComponent && this.renderSearchComponent(false)}
      </>
    );
  }
}

const mapStateToProps = (state) => {
  const {
    browser,
    config,
    map,
    modal,
    measure,
    animation,
    geosearch,
    ui,
  } = state;
  const { features: { geocodeSearch: isFeatureEnabled } } = config;
  const { isActive } = measure;
  const { gifActive } = animation;
  const { coordinates, isExpanded } = geosearch;
  const { isDistractionFreeModeActive } = ui;
  const isMobile = browser.lessThan.medium;
  const snapshotModalOpen = modal.isOpen && modal.id === 'TOOLBAR_SNAPSHOT';
  const geosearchMobileModalOpen = modal.isOpen && modal.id === 'TOOLBAR_GEOSEARCH_MOBILE';
  // Collapse when image download, GIF, measure tool, or distraction free mode is active
  const shouldCollapseFromOtherUI = snapshotModalOpen || isActive || gifActive || isDistractionFreeModeActive;

  return {
    coordinates,
    isExpanded,
    geosearchMobileModalOpen,
    isCoordinatePairWithinExtent: (targetCoordinates) => areCoordinatesWithinExtent(map, config, targetCoordinates),
    isMobile,
    shouldCollapseFromOtherUI,
    isFeatureEnabled,
  };
};

const mapDispatchToProps = (dispatch) => ({
  clearCoordinates: () => {
    dispatch(clearCoordinates());
  },
  selectCoordinatesToFly: (coordinates, addressAttributes) => {
    dispatch(selectCoordinatesToFly(coordinates, addressAttributes));
  },
  toggleReverseGeocodeActive: (isActive) => {
    dispatch(toggleReverseGeocodeActive(isActive));
  },
  toggleShowGeosearch: () => {
    dispatch(toggleShowGeosearch());
  },
});

Geosearch.propTypes = {
  isCoordinatePairWithinExtent: PropTypes.func,
  isFeatureEnabled: PropTypes.bool,
  clearCoordinates: PropTypes.func,
  coordinates: PropTypes.array,
  geosearchMobileModalOpen: PropTypes.bool,
  isExpanded: PropTypes.bool,
  isMobile: PropTypes.bool,
  selectCoordinatesToFly: PropTypes.func,
  shouldCollapseFromOtherUI: PropTypes.bool,
  toggleReverseGeocodeActive: PropTypes.func,
  toggleShowGeosearch: PropTypes.func,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Geosearch);
