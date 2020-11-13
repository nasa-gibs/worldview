import PropTypes from 'prop-types';
import React, { Component } from 'react';
import {
  Button, InputGroup, InputGroupAddon, UncontrolledTooltip,
} from 'reactstrap';
import {
  throttle as lodashThrottle,
  get as lodashGet,
} from 'lodash';
import googleTagManager from 'googleTagManager';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import SearchBox from './geosearch-input';
import Alert from '../util/alert';

import isValidCoordinates from './util';
import { reverseGeocode, suggest, processMagicKey } from '../../modules/geosearch/selectors';

class SearchComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isTouchDevice: false,
      showReverseGeocodeAlert: false,
      showExtentAlert: false,
    };
    this.throttleSuggest = lodashThrottle(suggest.bind(this), 500);
  }

  componentDidUpdate(prevProps) {
    const { coordinates } = this.props;
    const { showReverseGeocodeAlert } = this.state;

    if (showReverseGeocodeAlert && coordinates.length > 0) {
      const [prevLong, prevLat] = prevProps.coordinates;
      const [long, lat] = coordinates;
      if (prevLong !== long || prevLat !== lat) {
        this.dismissReverseGeocodeAlert();
      }
    }
  }

  // dismiss message instruction alert
  dismissReverseGeocodeAlert = () => this.setState({ showReverseGeocodeAlert: false });

  // set extent message error alert
  setExtentAlert = (shouldShow) => this.setState({ showExtentAlert: shouldShow });

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
      this.setExtentAlert(true);
    } else {
      const [longitude, latitude] = coordinatesPending;
      reverseGeocode([longitude, latitude]).then((results) => {
        selectCoordinatesToFly([longitude, latitude], results);
      });
      this.setExtentAlert(false);
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
          this.setExtentAlert(true);
        } else {
          selectCoordinatesToFly([parsedX, parsedY], addressAttributes);
        }
      }
    });
  }

  // handle input value change including text/coordinates typing, pasting, cutting
  onChange=(e, value) => {
    e.preventDefault();
    const {
      updateSearchResults, updateValue, updatePendingCoordinates,
    } = this.props;
    updateValue(value);

    // check for coordinate value
    const coordinatesInputValue = isValidCoordinates(value);
    if (coordinatesInputValue) {
      this.throttleSuggest.cancel();
      const { latitude, longitude } = coordinatesInputValue;
      this.setExtentAlert(false);
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
          } else {
            updateSearchResults([]);
          }
        });
      }
    }
  }

  // clear text input and search results
  clearInput = () => {
    const {
      updateSearchResults, updateValue,
    } = this.props;
    updateValue('');
    updateSearchResults([]);
    this.setState({
      showReverseGeocodeAlert: false,
      showExtentAlert: false,
    });
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
    });
    updateValue('');
    googleTagManager.pushEvent({
      event: 'geosearch_reverse_geocode',
    });
  }

  // render tooltip
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
    const message = `${isTouchDevice ? 'Tap' : 'Click'} on map to identify a location.`;

    return showReverseGeocodeAlert && (
      <Alert
        id="geosearch-select-coordinates-alert"
        isOpen
        iconClassName="faMapMarkerAlt"
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
        timeout={15000}
        message={message}
        onDismiss={() => this.setExtentAlert(false)}
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
          className="geosearch-search-minimize-button"
          onClick={toggleShowGeosearch}
        >
          {this.renderTooltip(buttonId, labelText)}
          <div className="geosearch-search-minimize-button-chevron" />
        </Button>
      </InputGroupAddon>
    );
  }

  // render add coordinate marker button for reverse geocode
  renderAddCoordinateButton = () => {
    const addCoordinateButtonId = 'geosearch-coordinate-button-addpoint';
    const addCoordinateLabelText = 'Add marker on map';

    return (
      <InputGroupAddon addonType="append">
        <Button
          id={addCoordinateButtonId}
          onTouchEnd={this.initReverseGeocode}
          onMouseDown={this.initReverseGeocode}
          className="geosearch-coordinate-button-addpoint"
        >
          {this.renderTooltip(addCoordinateButtonId, addCoordinateLabelText)}
          <FontAwesomeIcon icon="map-marker-alt" size="1x" />
        </Button>
      </InputGroupAddon>
    );
  }

  render() {
    const {
      coordinates,
      geosearchMobileModalOpen,
      isExpanded,
      isMobile,
      coordinatesPending,
      inputValue,
      searchResults,
    } = this.props;
    const {
      showExtentAlert,
    } = this.state;

    return (
      <>
        {/* Alerts */}
        {this.renderReverseGeocodeAlert()}
        {this.renderExtentAlert()}
        <div className="geosearch-component">
          <InputGroup className="geosearch-search-input-group">
            {/* Minimize button not visible in mobile */}
            {!isMobile && this.renderMinimizeButton()}
            <SearchBox
              clearInput={this.clearInput}
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
            {/* Add coordinate marker button */}
            {this.renderAddCoordinateButton()}
          </InputGroup>
        </div>
      </>
    );
  }
}

SearchComponent.propTypes = {
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
