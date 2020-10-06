import PropTypes from 'prop-types';
import React, { Component } from 'react';
import {
  ButtonGroup, Button, InputGroup, InputGroupAddon,
} from 'reactstrap';
import { get as lodashGet } from 'lodash';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMapMarkerAlt,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import SearchBox from './geosearch-input';

import isValidCoordinates from './util';
import { reverseGeocode, suggest, processMagicKey } from '../../modules/geosearch/selectors';

class SearchComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      inputValue: '',
      searchResults: [],
      coordinatesPending: [],
    };
    this.requestTimer = null;
  }

  // update input value
  updateValue = (inputValue) => this.setState({ inputValue });

  // update list of suggested search results
  updateSearchResults = (searchResults) => this.setState({ searchResults });

  // update array of pending coordinates
  updatePendingCoordinates = (coordinatesPending) => this.setState({ coordinatesPending });

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
      // text,
    } = item;

    processMagicKey(magicKey).then((result) => {
      if (lodashGet(result, 'candidates[0]')) {
        const firstCandidate = result.candidates[0];
        const { location } = firstCandidate;

        const { x, y } = location;
        const parsedX = parseFloat(x.toPrecision(7));
        const parsedY = parseFloat(y.toPrecision(7));
        selectCoordinatesToFly([parsedX, parsedY]);
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

  selectCoordinatesFromMap = (e) => {
    e.preventDefault();
    const { toggleReverseGeocodeActive } = this.props;
    toggleReverseGeocodeActive(true);
    this.updateValue('');
  }

  selectCoordinatesToFly = (coordinates) => {
    const { selectCoordinatesToFly } = this.props;
    selectCoordinatesToFly(coordinates);
  }

  render() {
    const {
      coordinates,
      clearCoordinates,
      toggleShowGeosearch,
    } = this.props;
    const {
      coordinatesPending,
      inputValue,
      searchResults,
    } = this.state;
    const hasCoordinates = coordinates.length > 0;

    const coordinateButtonGroupContainerClassName = `geosearch-coordinate-group-container ${hasCoordinates ? 'grouped' : ''}`;
    return (
      <div className="geosearch-component">
        <InputGroup className="geosearch-search-input-group">
          <InputGroupAddon addonType="prepend">
            <Button
              className="geosearch-search-minimize-button"
              title="Minimize search box"
              onClick={toggleShowGeosearch}
            >
              <FontAwesomeIcon icon={faChevronRight} size="1x" />
            </Button>
          </InputGroupAddon>
          <SearchBox
            coordinates={coordinates}
            coordinatesPending={coordinatesPending}
            inputValue={inputValue}
            onChange={this.onChange}
            onCoordinateInputSelect={this.onCoordinateInputSelect}
            onSelect={this.onSelect}
            searchResults={searchResults}
          />
          <InputGroupAddon
            addonType="append"
            className={coordinateButtonGroupContainerClassName}
          >
            <ButtonGroup className="geosearch-coordinate-button-group">
              <Button
                onTouchEnd={this.selectCoordinatesFromMap}
                onMouseDown={this.selectCoordinatesFromMap}
                className="geosearch-coordinate-button-addpoint"
                title="Add coordinates marker onto map"
              >
                <FontAwesomeIcon icon={faMapMarkerAlt} size="1x" />
              </Button>
              {hasCoordinates
                  && (
                    <Button
                      onTouchEnd={clearCoordinates}
                      onMouseDown={clearCoordinates}
                      className="geosearch-coordinate-button-remove"
                      title="Clear coordinates marker from map"
                    >
                      <p>X</p>
                    </Button>
                  )}
            </ButtonGroup>
          </InputGroupAddon>
        </InputGroup>
      </div>
    );
  }
}

SearchComponent.propTypes = {
  clearCoordinates: PropTypes.func,
  coordinates: PropTypes.array,
  selectCoordinatesToFly: PropTypes.func,
  toggleReverseGeocodeActive: PropTypes.func,
  toggleShowGeosearch: PropTypes.func,
};

export default SearchComponent;
