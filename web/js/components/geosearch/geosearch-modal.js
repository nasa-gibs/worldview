import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  Button, InputGroup, InputGroupAddon, UncontrolledTooltip,
} from 'reactstrap';
import {
  debounce as lodashDebounce,
  get as lodashGet,
} from 'lodash';
import googleTagManager from 'googleTagManager';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import SearchBox from './geosearch-input';
import Alert from '../util/alert';
import { getCoordinateFixedPrecision, isValidCoordinates } from './util';
import {
  clearSuggestions,
  getSuggestions,
  setPlaceMarker,
  setSuggestion,
  toggleReverseGeocodeActive,
  toggleShowGeosearch,
} from '../../modules/geosearch/actions';
import {
  areCoordinatesWithinExtent,
} from '../../modules/geosearch/util';
import {
  processMagicKey,
  reverseGeocode,
} from '../../modules/geosearch/util-api';

class GeosearchModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isTouchDevice: false,
      showInputAlert: false,
      showExtentAlert: false,
      showReverseGeocodeAlert: false,
      showNoSuggestionsAlert: false,
    };
    this.debounceGetSuggestions = lodashDebounce(this.getSuggestions, 400, { leading: true, trailing: true });
  }

  componentDidUpdate(prevProps) {
    const {
      coordinates, inputValue, isCoordinateSearchActive, suggestions,
    } = this.props;
    const {
      showExtentAlert, showInputAlert, showReverseGeocodeAlert, showNoSuggestionsAlert,
    } = this.state;

    if ((showReverseGeocodeAlert || showExtentAlert) && coordinates.length > 0) {
      const [prevLong, prevLat] = prevProps.coordinates;
      const [long, lat] = coordinates;
      if (prevLong !== long || prevLat !== lat) {
        this.clearAlerts();
      }
    }
    // clear geocode click instruction alert if search no longer active
    if (!isCoordinateSearchActive && prevProps.isCoordinateSearchActive) {
      this.dismissReverseGeocodeAlert();
    }
    // handle add/remove no suggestion alert based on inputValue and suggestions
    if (inputValue && suggestions.length === 0 && prevProps.suggestions.length > 0) {
      const prevInputValue = prevProps.inputValue;
      const prevSuggestedPlace = prevProps.suggestedPlace;
      const newSuggestedPlaceSelected = prevInputValue && prevSuggestedPlace.length > 0 && prevSuggestedPlace[0].text === prevInputValue;
      const isCoordinates = isValidCoordinates(inputValue);
      // prevent flag error on new place/coordinates being copy pasted
      if (!newSuggestedPlaceSelected && !isCoordinates) {
        this.setNoSuggestionsAlert(true);
        this.setInputAlertIcon(true);
      }
    } else if ((showNoSuggestionsAlert || showInputAlert) && (!inputValue || suggestions.length > 0)) {
      this.setNoSuggestionsAlert(false);
      this.setInputAlertIcon(false);
    }
  }

  // suggest place with text input to get place suggestions
  getSuggestions = (val) => {
    const { getSuggestions } = this.props;
    getSuggestions(val);
  }

  // dismiss message instruction alert
  dismissReverseGeocodeAlert = () => this.setState({ showReverseGeocodeAlert: false });

  // set extent message error alert
  setExtentAlert = (shouldShow) => this.setState({ showExtentAlert: shouldShow });

  // set no suggested places message error alert
  setNoSuggestionsAlert = (shouldShow) => this.setState({ showNoSuggestionsAlert: shouldShow });

  // set input alert icon
  setInputAlertIcon = (shouldShow) => this.setState({ showInputAlert: shouldShow });

  // clear all alerts
  clearAlerts = () => {
    this.setState({
      showInputAlert: false,
      showExtentAlert: false,
      showNoSuggestionsAlert: false,
      showReverseGeocodeAlert: false,
    });
  }

  // handle submitting search after inputing coordinates
  onCoordinateInputSelect = () => {
    const {
      clearSuggestions,
      coordinatesPending,
      isCoordinatePairWithinExtent,
      reverseGeocode,
      setPlaceMarker,
      updatePendingCoordinates,
      updateValue,
    } = this.props;

    const coordinatesWithinExtent = isCoordinatePairWithinExtent(coordinatesPending);
    if (!coordinatesWithinExtent) {
      this.setExtentAlert(true);
      this.setInputAlertIcon(true);
    } else {
      const [longitude, latitude] = coordinatesPending;
      reverseGeocode([longitude, latitude]).then((results) => {
        setPlaceMarker([longitude, latitude], results);
      });
      this.clearAlerts();
      updateValue('');
      clearSuggestions();
      updatePendingCoordinates([]);
    }
  }

  // handle selecting menu item in search results
  onSelect = (value, item) => {
    const {
      isCoordinatePairWithinExtent,
      processMagicKey,
      setPlaceMarker,
      setSuggestion,
      updateValue,
    } = this.props;
    updateValue(value);
    setSuggestion([item]);
    const {
      magicKey,
    } = item;

    googleTagManager.pushEvent({
      event: 'geosearch_selected_suggested_menu_item',
    });
    processMagicKey(magicKey).then((result) => {
      if (lodashGet(result, 'candidates[0]')) {
        const firstCandidate = result.candidates[0];
        const { location, attributes } = firstCandidate;
        const addressAttributes = { address: attributes };

        const { x, y } = location;
        const parsedX = getCoordinateFixedPrecision(x);
        const parsedY = getCoordinateFixedPrecision(y);

        const coordinatesWithinExtent = isCoordinatePairWithinExtent([parsedX, parsedY]);
        if (!coordinatesWithinExtent) {
          this.setExtentAlert(true);
          this.setInputAlertIcon(true);
        } else {
          setPlaceMarker([parsedX, parsedY], addressAttributes);
        }
      }
    }).catch((error) => console.error(error));
  }

  // handle input value change including text/coordinates typing, pasting, cutting
  onChange = (e, value) => {
    e.preventDefault();
    const {
      clearSuggestions,
      updateValue,
      updatePendingCoordinates,
    } = this.props;
    updateValue(value);

    // check for coordinate value
    const coordinatesInputValue = isValidCoordinates(value);
    if (coordinatesInputValue) {
      this.debounceGetSuggestions.cancel();
      const { latitude, longitude } = coordinatesInputValue;
      this.clearAlerts();
      clearSuggestions();
      updatePendingCoordinates([longitude, latitude]);
    } else if (!value) {
      // clear on empty input
      this.debounceGetSuggestions.cancel();
      clearSuggestions();
    } else {
      // provide suggestions to populate search result menu item(s)
      this.debounceGetSuggestions(value);
    }
  }

  // clear text input and search results
  clearInput = () => {
    const {
      clearSuggestions,
      updateValue,
    } = this.props;
    updateValue('');
    clearSuggestions();
    this.clearAlerts();
  }

  // initiate instruction alert and activate store level toggleReverseGeocodeActive
  initReverseGeocode = (e) => {
    e.preventDefault();
    const isTouchDevice = e.type === 'touchend';
    const { toggleReverseGeocodeActive, updateValue } = this.props;
    toggleReverseGeocodeActive(true);
    this.setState({
      isTouchDevice,
      showReverseGeocodeAlert: true,
      showExtentAlert: false,
      showNoSuggestionsAlert: false,
      showInputAlert: false,
    });
    updateValue('');
    googleTagManager.pushEvent({
      event: 'geosearch_reverse_geocode',
    });
  }

  // render hover tooltip
  renderTooltip = (buttonId, labelText) => {
    const { isMobile } = this.props;
    return !isMobile && (
      <UncontrolledTooltip
        trigger="hover"
        target={buttonId}
        boundariesElement="window"
        placement="bottom"
      >
        {labelText}
      </UncontrolledTooltip>
    );
  }

  // render alert message to instruct user map interaction
  renderReverseGeocodeAlert = () => {
    const {
      isTouchDevice,
      showReverseGeocodeAlert,
    } = this.state;
    const message = `${isTouchDevice ? 'Tap' : 'Click'} on map to identify a location.${isTouchDevice ? '' : ' Right click to cancel.'}`;

    return showReverseGeocodeAlert && (
      <Alert
        id="geosearch-select-coordinates-alert"
        isOpen
        icon="map-marker-alt"
        title="Geosearch Select Coordinates"
        timeout={6000}
        message={message}
        onDismiss={this.dismissReverseGeocodeAlert}
      />
    );
  }

  // render alert message to indicate entered location is outside of map extent
  renderExtentAlert = () => {
    const {
      showExtentAlert,
    } = this.state;
    const message = 'Provided location is outside of the map extent. Revise or try a different projection.';

    return showExtentAlert && (
      <Alert
        id="geosearch-select-coordinates-extent-alert"
        isOpen
        title="Selected Coordinates Outside Current Map Projection"
        timeout={12000}
        message={message}
        onDismiss={() => this.setExtentAlert(false)}
      />
    );
  }

  // render alert message to indicate no suggestions for input value
  renderNoSuggestionsAlert = () => {
    const {
      showNoSuggestionsAlert,
    } = this.state;
    const message = 'No suggested places available. Check your text or try a different place.';

    return showNoSuggestionsAlert && (
      <Alert
        id="geosearch-no-suggestions-available-alert"
        isOpen
        title="No suggested places are available"
        timeout={12000}
        message={message}
        onDismiss={() => this.setNoSuggestionsAlert(false)}
      />
    );
  }

  // render geosearch component minimize button (not visible in mobile)
  renderMinimizeButton = () => {
    const { toggleShowGeosearch } = this.props;
    const buttonId = 'geosearch-search-minimize-button';
    const labelText = 'Hide Geosearch';
    return (
      <InputGroupAddon addonType="prepend">
        <Button
          id={buttonId}
          className={buttonId}
          onClick={toggleShowGeosearch}
        >
          {this.renderTooltip(buttonId, labelText)}
          <div className={`${buttonId}-chevron`} />
        </Button>
      </InputGroupAddon>
    );
  }

  // render add coordinate marker button for reverse geocode
  renderAddCoordinateButton = () => {
    const buttonId = 'geosearch-add-coordinate-button';
    const labelText = 'Add marker on map';

    return (
      <InputGroupAddon addonType="append">
        <Button
          id={buttonId}
          onTouchEnd={this.initReverseGeocode}
          onMouseDown={this.initReverseGeocode}
          className={buttonId}
        >
          {this.renderTooltip(buttonId, labelText)}
          <FontAwesomeIcon icon="map-marker-alt" size="1x" />
        </Button>
      </InputGroupAddon>
    );
  }

  render() {
    const {
      coordinatesPending,
      geosearchMobileModalOpen,
      inputValue,
      isMobile,
      preventInputFocus,
      suggestions,
    } = this.props;
    const {
      showInputAlert,
    } = this.state;

    return (
      <>
        {/* Alerts */}
        {this.renderReverseGeocodeAlert()}
        {this.renderNoSuggestionsAlert()}
        {this.renderExtentAlert()}
        <div className="geosearch-component">
          <InputGroup className="geosearch-search-input-group">
            {/* Minimize button not visible in mobile */}
            {!isMobile && this.renderMinimizeButton()}
            <SearchBox
              clearInput={this.clearInput}
              coordinatesPending={coordinatesPending}
              geosearchMobileModalOpen={geosearchMobileModalOpen}
              inputValue={inputValue}
              isMobile={isMobile}
              preventInputFocus={preventInputFocus}
              onChange={this.onChange}
              onCoordinateInputSelect={this.onCoordinateInputSelect}
              onSelect={this.onSelect}
              activeAlert={showInputAlert}
              suggestions={suggestions}
            />
            {/* Add coordinate marker button */}
            {this.renderAddCoordinateButton()}
          </InputGroup>
        </div>
      </>
    );
  }
}

const mapStateToProps = (state) => {
  const {
    browser,
    config,
    lastAction,
    map,
    modal,
    geosearch,
  } = state;
  const {
    coordinates,
    isCoordinateSearchActive,
    suggestions,
    suggestedPlace,
  } = geosearch;
  const isMobile = browser.lessThan.medium;
  const geosearchMobileModalOpen = modal.isOpen && modal.id === 'TOOLBAR_GEOSEARCH_MOBILE';
  // Collapse when image download, GIF, measure tool, or distraction free mode is active
  const measureToggledOff = lastAction.type === 'MEASURE/TOGGLE_MEASURE_ACTIVE' && lastAction.value === false;

  return {
    preventInputFocus: measureToggledOff,
    coordinates,
    geosearchMobileModalOpen,
    isCoordinatePairWithinExtent: (targetCoordinates) => areCoordinatesWithinExtent(map, config, targetCoordinates),
    isCoordinateSearchActive,
    isMobile,
    processMagicKey: (magicKey) => processMagicKey(magicKey, config),
    reverseGeocode: (coords) => reverseGeocode(coords, config),
    suggestions,
    suggestedPlace,
  };
};

const mapDispatchToProps = (dispatch) => ({
  setPlaceMarker: (coordinates, addressAttributes) => {
    dispatch(setPlaceMarker(coordinates, addressAttributes));
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

GeosearchModal.propTypes = {
  clearSuggestions: PropTypes.func,
  coordinates: PropTypes.array,
  coordinatesPending: PropTypes.array,
  geosearchMobileModalOpen: PropTypes.bool,
  getSuggestions: PropTypes.func,
  inputValue: PropTypes.string,
  isCoordinatePairWithinExtent: PropTypes.func,
  isCoordinateSearchActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  preventInputFocus: PropTypes.bool,
  processMagicKey: PropTypes.func,
  reverseGeocode: PropTypes.func,
  setPlaceMarker: PropTypes.func,
  setSuggestion: PropTypes.func,
  suggestions: PropTypes.array,
  suggestedPlace: PropTypes.array,
  toggleReverseGeocodeActive: PropTypes.func,
  toggleShowGeosearch: PropTypes.func,
  updatePendingCoordinates: PropTypes.func,
  updateValue: PropTypes.func,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(GeosearchModal);
