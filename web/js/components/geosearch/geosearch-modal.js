import PropTypes from 'prop-types';
import React, { Component } from 'react';
import {
  ButtonGroup, Button, InputGroup, InputGroupAddon,
} from 'reactstrap';
import { get as lodashGet } from 'lodash';
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
      inputValue: '',
      isTouchDevice: false,
      searchResults: [],
      coordinatesPending: [],
      showAlert: false,
    };
    this.requestTimer = null;
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

  // update input value
  updateValue = (inputValue) => this.setState({ inputValue });

  // update list of suggested search results
  updateSearchResults = (searchResults) => this.setState({ searchResults });

  // update array of pending coordinates
  updatePendingCoordinates = (coordinatesPending) => this.setState({ coordinatesPending });

  // dismiss message instruction alert
  dismissAlert = () => this.setState({ showAlert: false });

  // handle submitting search after inputing coordinates
  onCoordinateInputSelect = () => {
    const { selectCoordinatesToFly } = this.props;
    const { coordinatesPending } = this.state;

    const [longitude, latitude] = coordinatesPending;
    reverseGeocode([longitude, latitude]).then((results) => {
      selectCoordinatesToFly([longitude, latitude], results);
    });
    this.updatePendingCoordinates([]);
  }

  // handle selecting menu item in search results
  onSelect=(value, item) => {
    const { selectCoordinatesToFly } = this.props;

    this.updateSearchResults([item]);
    this.updateValue(value);
    const {
      magicKey,
    } = item;

    processMagicKey(magicKey).then((result) => {
      if (lodashGet(result, 'candidates[0]')) {
        const firstCandidate = result.candidates[0];
        const { location, attributes } = firstCandidate;
        const addressAttributes = { address: attributes };

        const { x, y } = location;
        const parsedX = parseFloat(x.toPrecision(9));
        const parsedY = parseFloat(y.toPrecision(9));
        selectCoordinatesToFly([parsedX, parsedY], addressAttributes);
      }
    });
  }

  // handle input value change including text/coordinates typing, pasting, cutting
  onChange=(e, value) => {
    e.preventDefault();
    this.updateValue(value);

    // check for coordinate value
    const coordinatesInputValue = isValidCoordinates(value);
    if (coordinatesInputValue) {
      clearTimeout(this.requestTimer);
      const { latitude, longitude } = coordinatesInputValue;
      this.setState({
        searchResults: [],
        coordinatesPending: [longitude, latitude],
      });
    } else {
      clearTimeout(this.requestTimer);
      if (!value) {
        this.updateSearchResults([]);
      } else {
        // provide suggestions to populate search result menu item(s)
        this.requestTimer = suggest(value).then((items) => {
          if (lodashGet(items, 'suggestions')) {
            const { suggestions } = items;
            this.updateSearchResults(suggestions);
          }
        });
      }
    }
  }

  // initiate instruction alert and activate store level toggleReverseGeocodeActive
  selectCoordinatesFromMap = (e) => {
    e.preventDefault();
    const isTouchDevice = e.type === 'touchend';
    const { toggleReverseGeocodeActive } = this.props;
    toggleReverseGeocodeActive(true);
    this.setState({
      isTouchDevice,
      showAlert: true,
      inputValue: '',
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
    } = this.props;
    const {
      coordinatesPending,
      inputValue,
      isTouchDevice,
      searchResults,
      showAlert,
    } = this.state;
    const hasCoordinates = coordinates.length > 0;

    const alertMessage = `${isTouchDevice ? 'Tap' : 'Click'} on map to add a reverse geocode marker.`;
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
  geosearchMobileModalOpen: PropTypes.bool,
  isExpanded: PropTypes.bool,
  isMobile: PropTypes.bool,
  selectCoordinatesToFly: PropTypes.func,
  toggleReverseGeocodeActive: PropTypes.func,
  toggleShowGeosearch: PropTypes.func,
};

export default SearchComponent;
