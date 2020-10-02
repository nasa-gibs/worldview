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
      coordinates,
      clearCoordinates,
      isDistractionFreeModeActive,
      isExpanded,
      selectCoordinatesToFly,
      shouldBeCollapsed,
      toggleShowGeosearch,
      toggleReverseGeocodeActive,
    } = this.props;
    const shouldHide = shouldBeCollapsed || isDistractionFreeModeActive || !isExpanded;
    return (
      <GeosearchModal
        coordinates={coordinates}
        shouldHide={shouldHide}
        clearCoordinates={clearCoordinates}
        selectCoordinatesToFly={selectCoordinatesToFly}
        toggleShowGeosearch={toggleShowGeosearch}
        toggleReverseGeocodeActive={toggleReverseGeocodeActive}
      />
    );
  }

  renderSearchButton = () => {
    const { isExpanded, toggleShowGeosearch } = this.props;
    return (
      <Button
        id="wv-geosearch-button"
        className="wv-toolbar-button"
        title="Search by place name or reverse search using coordinates"
        onTouchEnd={toggleShowGeosearch}
        onMouseDown={toggleShowGeosearch}
        // disabled={isExpanded}
        // color="none"
      >
        <FontAwesomeIcon icon={faSearchLocation} size="1x" />
      </Button>
    );
  }

  render() {
    const {
      isExpanded,
      isFeatureEnabled,
    } = this.props;
    if (!isFeatureEnabled) {
      return null;
    }

    const containerClass = `geosearch-component-button-container ${isExpanded ? 'expanded' : ''}`;
    return (
      <>
        <div className={containerClass}>
          {isExpanded
            ? this.renderSearchComponent()
            : this.renderSearchButton()}
        </div>
      </>
    );
  }
}

const mapStateToProps = (state) => {
  const {
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
  const snapshotModalOpen = modal.isOpen && modal.id === 'TOOLBAR_SNAPSHOT';
  // Collapse when Image download / GIF /  is open or measure tool active
  const shouldBeCollapsed = snapshotModalOpen || measure.isActive || animation.gifActive;

  return {
    coordinates,
    isExpanded,
    shouldBeCollapsed,
    isFeatureEnabled: search,
    isDistractionFreeModeActive,
  };
};
const mapDispatchToProps = (dispatch) => ({
  selectCoordinatesToFly: (coordinates) => {
    dispatch(selectCoordinatesToFly(coordinates));
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
  selectCoordinatesToFly: PropTypes.func,
  shouldBeCollapsed: PropTypes.bool,
  toggleReverseGeocodeActive: PropTypes.func,
  toggleShowGeosearch: PropTypes.func,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Geosearch);
