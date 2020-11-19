import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import GeosearchModal from './geosearch-modal';
import {
  clearCoordinates,
  clearSuggestions,
  selectCoordinatesToFly,
  toggleShowGeosearch,
  toggleReverseGeocodeActive,
  setSuggestion,
  getSuggestions,
} from '../../modules/geosearch/actions';
import {
  areCoordinatesWithinExtent,
} from '../../modules/geosearch/selectors';
import {
  processMagicKey,
  reverseGeocode,
} from '../../modules/geosearch/util';

class Geosearch extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      inputValue: '',
      coordinatesPending: [],
    };
  }

  componentDidUpdate(prevProps) {
    const { isExpanded, isMobile, toggleShowGeosearch } = this.props;
    if (isExpanded && prevProps.isMobile !== isMobile) {
      toggleShowGeosearch();
    }
  }

  // update input value
  updateValue = (inputValue) => this.setState({ inputValue });

  // update array of pending coordinates
  updatePendingCoordinates = (coordinatesPending) => this.setState({ coordinatesPending });

  renderSearchComponent = (isMobile) => {
    const {
      clearCoordinates,
      coordinates,
      geosearchMobileModalOpen,
      getSuggestions,
      isCoordinatePairWithinExtent,
      isCoordinateSearchActive,
      isExpanded,
      processMagicKey,
      reverseGeocode,
      selectCoordinatesToFly,
      setSuggestion,
      suggestions,
      toggleReverseGeocodeActive,
      toggleShowGeosearch,
    } = this.props;
    const {
      coordinatesPending,
      inputValue,
    } = this.state;

    return (
      <GeosearchModal
        clearCoordinates={clearCoordinates}
        coordinates={coordinates}
        coordinatesPending={coordinatesPending}
        geosearchMobileModalOpen={geosearchMobileModalOpen}
        getSuggestions={getSuggestions}
        inputValue={inputValue}
        isCoordinatePairWithinExtent={isCoordinatePairWithinExtent}
        isCoordinateSearchActive={isCoordinateSearchActive}
        isExpanded={isExpanded}
        isMobile={isMobile}
        processMagicKey={processMagicKey}
        reverseGeocode={reverseGeocode}
        selectCoordinatesToFly={selectCoordinatesToFly}
        setSuggestion={setSuggestion}
        suggestions={suggestions}
        toggleReverseGeocodeActive={toggleReverseGeocodeActive}
        toggleShowGeosearch={toggleShowGeosearch}
        updatePendingCoordinates={this.updatePendingCoordinates}
        updateValue={this.updateValue}
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
  const { features: { geocodeSearch: { url: requestUrl } } } = config;
  const isFeatureEnabled = !!requestUrl;
  const { isActive } = measure;
  const { gifActive } = animation;
  const {
    coordinates, isCoordinateSearchActive, isExpanded, suggestions,
  } = geosearch;
  const { isDistractionFreeModeActive } = ui;
  const isMobile = browser.lessThan.medium;
  const snapshotModalOpen = modal.isOpen && modal.id === 'TOOLBAR_SNAPSHOT';
  const geosearchMobileModalOpen = modal.isOpen && modal.id === 'TOOLBAR_GEOSEARCH_MOBILE';
  // Collapse when image download, GIF, measure tool, or distraction free mode is active
  const shouldCollapseFromOtherUI = snapshotModalOpen || isActive || gifActive || isDistractionFreeModeActive;

  return {
    coordinates,
    geosearchMobileModalOpen,
    isCoordinatePairWithinExtent: (targetCoordinates) => areCoordinatesWithinExtent(map, config, targetCoordinates),
    isCoordinateSearchActive,
    isExpanded,
    isFeatureEnabled,
    isMobile,
    processMagicKey: (magicKey) => processMagicKey(magicKey, config),
    reverseGeocode: (coords) => reverseGeocode(coords, config),
    shouldCollapseFromOtherUI,
    suggestions,
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
  getSuggestions: (val) => {
    dispatch(getSuggestions(val));
  },
  clearSuggestions: () => {
    dispatch(clearSuggestions());
  },
  setSuggestion: (suggestion) => {
    dispatch(setSuggestion(suggestion));
  },
});

Geosearch.propTypes = {
  clearCoordinates: PropTypes.func,
  coordinates: PropTypes.array,
  geosearchMobileModalOpen: PropTypes.bool,
  getSuggestions: PropTypes.func,
  isCoordinatePairWithinExtent: PropTypes.func,
  isCoordinateSearchActive: PropTypes.bool,
  isExpanded: PropTypes.bool,
  isFeatureEnabled: PropTypes.bool,
  isMobile: PropTypes.bool,
  processMagicKey: PropTypes.func,
  reverseGeocode: PropTypes.func,
  selectCoordinatesToFly: PropTypes.func,
  setSuggestion: PropTypes.func,
  shouldCollapseFromOtherUI: PropTypes.bool,
  suggestions: PropTypes.array,
  toggleReverseGeocodeActive: PropTypes.func,
  toggleShowGeosearch: PropTypes.func,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Geosearch);
