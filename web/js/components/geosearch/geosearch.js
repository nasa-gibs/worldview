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
  onToggle,
} from '../../modules/modal/actions';

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

  handleClearCoordinatesClick = () => {
    const { clearCoordinates, coordinatesDialogOpen, onToggle } = this.props;
    if (coordinatesDialogOpen) {
      onToggle();
    }
    clearCoordinates();
  }

  handleSelectCordinatesToFly = (coordinates, addressAttributes) => {
    const { selectCoordinatesToFly, coordinatesDialogOpen, onToggle } = this.props;
    if (coordinatesDialogOpen) {
      onToggle();
    }
    selectCoordinatesToFly(coordinates, addressAttributes);
  }

  handleReverseGeocodeActive = (isActive) => {
    const { toggleReverseGeocodeActive, coordinatesDialogOpen, onToggle } = this.props;
    if (coordinatesDialogOpen) {
      onToggle();
    }
    toggleReverseGeocodeActive(isActive);
  }

  renderSearchComponent = (isMobile) => {
    const {
      coordinates,
      geosearchMobileModalOpen,
      isExpanded,
      toggleShowGeosearch,
    } = this.props;

    return (
      <GeosearchModal
        coordinates={coordinates}
        geosearchMobileModalOpen={geosearchMobileModalOpen}
        isExpanded={isExpanded}
        isMobile={isMobile}
        handleClearCoordinatesClick={this.handleClearCoordinatesClick}
        handleSelectCordinatesToFly={this.handleSelectCordinatesToFly}
        handleReverseGeocodeActive={this.handleReverseGeocodeActive}
        toggleShowGeosearch={toggleShowGeosearch}
      />
    );
  }

  render() {
    const {
      isDistractionFreeModeActive,
      isExpanded,
      isFeatureEnabled,
      isMobile,
      shouldBeCollapsed,
    } = this.props;
    if (!isFeatureEnabled) {
      return null;
    }

    const shouldShowComponent = isExpanded && !shouldBeCollapsed && !isDistractionFreeModeActive;
    return (
      <>
        {isMobile
          ? this.renderSearchComponent(true)
          : shouldShowComponent && this.renderSearchComponent()}
      </>
    );
  }
}

const mapStateToProps = (state) => {
  const {
    browser,
    config,
    modal,
    measure,
    animation,
    geosearch,
    ui,
  } = state;
  const { features: { geocodeSearch: isFeatureEnabled } } = config;
  const { coordinates, isExpanded } = geosearch;
  const { isDistractionFreeModeActive } = ui;
  const isMobile = browser.lessThan.medium;
  const snapshotModalOpen = modal.isOpen && modal.id === 'TOOLBAR_SNAPSHOT';
  const geosearchMobileModalOpen = modal.isOpen && modal.id === 'TOOLBAR_GEOSEARCH_MOBILE';
  const coordinatesDialogOpen = modal.isOpen && modal.id.includes('COORDINATES_VECTOR_DIALOG');
  // Collapse when Image download / GIF /  is open or measure tool active
  const shouldBeCollapsed = snapshotModalOpen || measure.isActive || animation.gifActive;

  return {
    coordinates,
    isExpanded,
    coordinatesDialogOpen,
    geosearchMobileModalOpen,
    isMobile,
    shouldBeCollapsed,
    isFeatureEnabled,
    isDistractionFreeModeActive,
  };
};
const mapDispatchToProps = (dispatch) => ({
  selectCoordinatesToFly: (coordinates, addressAttributes) => {
    dispatch(selectCoordinatesToFly(coordinates, addressAttributes));
  },
  toggleShowGeosearch: () => {
    dispatch(toggleShowGeosearch());
  },
  clearCoordinates: () => {
    dispatch(clearCoordinates());
  },
  toggleReverseGeocodeActive: (isActive) => {
    dispatch(toggleReverseGeocodeActive(isActive));
  },
  onToggle: () => {
    dispatch(onToggle());
  },
});

Geosearch.propTypes = {
  isFeatureEnabled: PropTypes.bool,
  clearCoordinates: PropTypes.func,
  coordinates: PropTypes.array,
  coordinatesDialogOpen: PropTypes.bool,
  geosearchMobileModalOpen: PropTypes.bool,
  isExpanded: PropTypes.bool,
  isDistractionFreeModeActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  onToggle: PropTypes.func,
  selectCoordinatesToFly: PropTypes.func,
  shouldBeCollapsed: PropTypes.bool,
  toggleReverseGeocodeActive: PropTypes.func,
  toggleShowGeosearch: PropTypes.func,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Geosearch);
