import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Button } from 'reactstrap';
// import googleTagManager from 'googleTagManager';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearchLocation } from '@fortawesome/free-solid-svg-icons';
import GeosearchModal from './geosearch-modal';
import {
  clearCoordinates,
  selectCoordinatesToFly,
  toggleShowGeosearch,
  toggleReverseGeocodeActive,
} from '../../modules/geosearch/actions';

class Geosearch extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  renderSearchComponent = () => {
    const {
      clearCoordinates,
      coordinates,
      selectCoordinatesToFly,
      toggleReverseGeocodeActive,
      toggleShowGeosearch,
    } = this.props;

    return (
      <GeosearchModal
        clearCoordinates={clearCoordinates}
        coordinates={coordinates}
        selectCoordinatesToFly={selectCoordinatesToFly}
        toggleReverseGeocodeActive={toggleReverseGeocodeActive}
        toggleShowGeosearch={toggleShowGeosearch}
      />
    );
  }

  renderSearchButton = () => {
    const { isMobile, toggleShowGeosearch } = this.props;
    const faSize = isMobile ? '2x' : '1x';

    return (
      <Button
        type="button"
        id="wv-geosearch-button"
        className="wv-toolbar-button"
        title="Search by place name or reverse search using coordinates"
        // onTouchEnd={toggleShowGeosearch}
        // onMouseDown={toggleShowGeosearch}
        onClick={toggleShowGeosearch}
      >
        <FontAwesomeIcon icon={faSearchLocation} size={faSize} />
      </Button>
    );
  }

  render() {
    const {
      isExpanded,
      isFeatureEnabled,
      shouldBeCollapsed,
      isDistractionFreeModeActive,
    } = this.props;
    if (!isFeatureEnabled) {
      return null;
    }

    const shouldShowComponent = isExpanded && !shouldBeCollapsed && !isDistractionFreeModeActive;
    return (
      <>
        {shouldShowComponent
          ? this.renderSearchComponent()
          : this.renderSearchButton()}
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
  const { features: { geocodeSearch: search } } = config;
  const { coordinates, isExpanded } = geosearch;
  const { isDistractionFreeModeActive } = ui;
  const isMobile = browser.lessThan.medium;
  const snapshotModalOpen = modal.isOpen && modal.id === 'TOOLBAR_SNAPSHOT';
  // Collapse when Image download / GIF /  is open or measure tool active
  const shouldBeCollapsed = snapshotModalOpen || measure.isActive || animation.gifActive;

  return {
    coordinates,
    isExpanded,
    isMobile,
    shouldBeCollapsed,
    isFeatureEnabled: search,
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
});

Geosearch.propTypes = {
  isFeatureEnabled: PropTypes.bool.isRequired,
  clearCoordinates: PropTypes.func,
  coordinates: PropTypes.array,
  isExpanded: PropTypes.bool,
  isDistractionFreeModeActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  selectCoordinatesToFly: PropTypes.func,
  shouldBeCollapsed: PropTypes.bool,
  toggleReverseGeocodeActive: PropTypes.func,
  toggleShowGeosearch: PropTypes.func,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Geosearch);
