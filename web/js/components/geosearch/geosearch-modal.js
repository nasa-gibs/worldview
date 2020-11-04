import PropTypes from 'prop-types';
import React, { Component } from 'react';
import {
  ButtonGroup, Button, InputGroup, InputGroupAddon,
} from 'reactstrap';
import {
  throttle as lodashThrottle,
  get as lodashGet,
} from 'lodash';
import googleTagManager from 'googleTagManager';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMapMarkerAlt,
  faSlash,
} from '@fortawesome/free-solid-svg-icons';
import SearchBox from './geosearch-input';
import Alert from '../util/alert';

import isValidCoordinates from './util';
import { reverseGeocode, suggest, processMagicKey } from '../../modules/geosearch/selectors';

class SearchComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isTouchDevice: false,
      showAlert: false,
      showExtentAlert: false,
    };
    this.throttleSuggest = lodashThrottle(suggest.bind(this), 500);
  }

  componentDidUpdate(prevProps) {
    const { coordinates } = this.props;
    const { showAlert } = this.state;

    if (showAlert && coordinates.length > 0) {
      const [prevLong, prevLat] = prevProps.coordinates;
      const [long, lat] = coordinates;
      if (prevLong !== long || prevLat !== lat) {
        this.dismissAlert();
      }
    }
  }

  // dismiss message instruction alert
  dismissAlert = () => this.setState({ showAlert: false });

  // dismiss extent message error alert
  dismissExtentAlert = () => this.setState({ showExtentAlert: false });

  // handle submitting search after inputing coordinates
  onCoordinateInputSelect = () => {
    const {
      coordinatesPending,
      isCoordinatePairWithinExtent,
      selectCoordinatesToFly,
      updatePendingCoordinates,
      updateSearchResults,
      updateValue,
    } = this.props;

    const coordinatesWithinExtent = isCoordinatePairWithinExtent(coordinatesPending);
    if (coordinatesWithinExtent === false) {
      this.setState({
        showExtentAlert: true,
      });
    } else {
      const [longitude, latitude] = coordinatesPending;
      reverseGeocode([longitude, latitude]).then((results) => {
        selectCoordinatesToFly([longitude, latitude], results);
      });
      this.setState({
        showExtentAlert: false,
      });
      updateValue('');
      updateSearchResults([]);
      updatePendingCoordinates([]);
    }
  }

  // handle selecting menu item in search results
  onSelect=(value, item) => {
    const {
      isCoordinatePairWithinExtent,
      selectCoordinatesToFly,
      updateSearchResults,
      updateValue,
    } = this.props;
    updateValue(value);
    updateSearchResults([item]);
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
        const parsedX = parseFloat(x.toPrecision(9));
        const parsedY = parseFloat(y.toPrecision(9));

        const coordinatesWithinExtent = isCoordinatePairWithinExtent([parsedX, parsedY]);
        if (coordinatesWithinExtent === false) {
          this.setState({
            showExtentAlert: true,
          });
        } else {
          selectCoordinatesToFly([parsedX, parsedY], addressAttributes);
        }
      }
    });
  }

  // handle input value change including text/coordinates typing, pasting, cutting
  onChange=(e, value) => {
    e.preventDefault();
    const { updateSearchResults, updateValue, updatePendingCoordinates } = this.props;
    updateValue(value);

    // check for coordinate value
    const coordinatesInputValue = isValidCoordinates(value);
    if (coordinatesInputValue) {
      this.throttleSuggest.cancel();
      const { latitude, longitude } = coordinatesInputValue;
      this.setState({
        showExtentAlert: false,
      });
      updateSearchResults([]);
      updatePendingCoordinates([longitude, latitude]);
    } else {
      this.throttleSuggest.cancel();
      if (!value) {
        updateSearchResults([]);
      } else {
        // provide suggestions to populate search result menu item(s)
        return this.throttleSuggest(value).then((items) => {
          if (lodashGet(items, 'suggestions')) {
            const { suggestions } = items;
            updateSearchResults(suggestions);
          }
        });
      }
    }
  }

  // initiate instruction alert and activate store level toggleReverseGeocodeActive
  selectCoordinatesFromMap = (e) => {
    e.preventDefault();
    const isTouchDevice = e.type === 'touchend';
    const { toggleReverseGeocodeActive, updateValue } = this.props;
    toggleReverseGeocodeActive(true);
    this.setState({
      isTouchDevice,
      showAlert: true,
      showExtentAlert: false,
    });
    updateValue('');
    googleTagManager.pushEvent({
      event: 'geosearch_reverse_geocode',
    });
  }

  // clear selected marker/coordinates from map
  clearCoordinatesMarker = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const { clearCoordinates } = this.props;
    clearCoordinates();
  }

  render() {
    const {
      coordinates,
      geosearchMobileModalOpen,
      isExpanded,
      isMobile,
      toggleShowGeosearch,
      coordinatesPending,
      inputValue,
      searchResults,
    } = this.props;
    const {
      isTouchDevice,
      showAlert,
      showExtentAlert,
    } = this.state;
    const hasCoordinates = coordinates.length > 0;

    const alertMessage = `${isTouchDevice ? 'Tap' : 'Click'} on map to identify a point on the map.`;
    const extentAlertMessage = 'Provided location is outside of the map extent. Revise or try a different projection.';
    const coordinateButtonGroupContainerClassName = `geosearch-coordinate-group-container ${hasCoordinates ? 'grouped' : ''}`;
    return (
      <>
        {showAlert && (
        <Alert
          id="geosearch-select-coordinates-alert"
          isOpen
          iconClassName="faMapMarkerAlt"
          title="Geosearch Select Coordinates"
          timeout={6000}
          message={alertMessage}
          onDismiss={this.dismissAlert}
        />
        )}
        {showExtentAlert && (
        <Alert
          id="geosearch-select-coordinates-extent-alert"
          isOpen
          title="Selected Coordinates Outside Current Map Projection"
          timeout={15000}
          message={extentAlertMessage}
          onDismiss={this.dismissExtentAlert}
        />
        )}
        <div className="geosearch-component">
          <InputGroup className="geosearch-search-input-group">
            {!isMobile
          && (
          <InputGroupAddon addonType="prepend">
            <Button
              className="geosearch-search-minimize-button"
              title="Minimize search box"
              onClick={toggleShowGeosearch}
            >
              <div className="geosearch-search-minimize-button-chevron" />
            </Button>
          </InputGroupAddon>
          )}
            <SearchBox
              coordinates={coordinates}
              coordinatesPending={coordinatesPending}
              inputValue={inputValue}
              onChange={this.onChange}
              onCoordinateInputSelect={this.onCoordinateInputSelect}
              onSelect={this.onSelect}
              searchResults={searchResults}
              geosearchMobileModalOpen={geosearchMobileModalOpen}
              isExpanded={isExpanded}
              isMobile={isMobile}
              showExtentAlert={showExtentAlert}
            />
            <InputGroupAddon
              addonType="append"
              className={coordinateButtonGroupContainerClassName}
            >
              <ButtonGroup
                className="geosearch-coordinate-button-group"
              >
                <Button
                  onTouchEnd={this.selectCoordinatesFromMap}
                  onMouseDown={this.selectCoordinatesFromMap}
                  className="geosearch-coordinate-button-addpoint"
                  title="Add coordinates marker onto map"
                  style={{ marginRight: hasCoordinates && isMobile ? '6px' : '0' }}
                >
                  <FontAwesomeIcon icon={faMapMarkerAlt} size="1x" />
                </Button>
                {hasCoordinates
                  && (
                    <Button
                      onTouchEnd={this.clearCoordinatesMarker}
                      onMouseDown={this.clearCoordinatesMarker}
                      className="geosearch-coordinate-button-remove"
                      title="Clear coordinates marker from map"
                    >
                      <FontAwesomeIcon icon={faSlash} />
                      <FontAwesomeIcon icon={faMapMarkerAlt} size="1x" />
                    </Button>
                  )}
              </ButtonGroup>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </>
    );
  }
}

SearchComponent.propTypes = {
  clearCoordinates: PropTypes.func,
  coordinates: PropTypes.array,
  coordinatesPending: PropTypes.array,
  geosearchMobileModalOpen: PropTypes.bool,
  inputValue: PropTypes.string,
  isCoordinatePairWithinExtent: PropTypes.func,
  isExpanded: PropTypes.bool,
  isMobile: PropTypes.bool,
  searchResults: PropTypes.array,
  selectCoordinatesToFly: PropTypes.func,
  toggleReverseGeocodeActive: PropTypes.func,
  toggleShowGeosearch: PropTypes.func,
  updatePendingCoordinates: PropTypes.func,
  updateSearchResults: PropTypes.func,
  updateValue: PropTypes.func,
};

export default SearchComponent;
