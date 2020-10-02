import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Autocomplete from 'react-autocomplete';
import isValidCoordinates from './util';
import { reverseGeocode, suggest, processMagicKey } from '../../modules/geosearch/selectors';


class SearchBox extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchResults: [],
    };
    this.requestTimer = null;
  }

  componentDidMount() {
    this.input.focus();
  }

  updateSearchResults = (searchResults) => this.setState({ searchResults });

  // handle selecting menu item in search results
  onSelect=(value, item) => {
    const { selectCoordinatesToFly, updateValue } = this.props;
    // set the menu to only the selected item

    this.updateSearchResults([item]);
    updateValue(value);
    const {
      magicKey,
      // text,
    } = item;

    processMagicKey(magicKey).then((result) => {
      const firstCandidate = result.candidates[0];
      const { location } = firstCandidate;
      // TODO TEST NO FIRST CANDIDATE
      const { x, y } = location;
      const parsedX = parseFloat(x.toPrecision(7));
      const parsedY = parseFloat(y.toPrecision(7));
      selectCoordinatesToFly([parsedX, parsedY]);
    });
  }

  // handle input value change including text/coordinates typing, pasting, cutting
  onChange=(e, value) => {
    // e.preventDefault();
    const { selectCoordinatesToFly, updateValue } = this.props;

    updateValue(value);
    // check for coordinate value
    const coordinatesInputValue = isValidCoordinates(value);
    if (coordinatesInputValue) {
      clearTimeout(this.requestTimer);
      this.updateSearchResults([]);

      const { latitude, longitude } = coordinatesInputValue;
      // TODO: require click/enter to search coordinates
      reverseGeocode([longitude, latitude]).then((results) => {
        selectCoordinatesToFly([longitude, latitude], results);
      });
    } else {
      clearTimeout(this.requestTimer);
      if (!value) {
        this.updateSearchResults([]);
      } else {
        // provide suggestions to populate search result menu item(s)
        this.requestTimer = suggest(value).then((items) => {
          const { suggestions } = items;
          this.updateSearchResults(suggestions);
        });
      }
    }
  }

  // search result menu item container
  renderMenu= (children) => (
    <div className="geosearch-results-menu">
      {children}
    </div>
  )

  // individual menu items with conditional styling
  renderItem=(item, isHighlighted) => (
    <div
      className="geosearch-item"
      style={{
        background: isHighlighted ? '#0070c8' : '#fff',
        color: isHighlighted ? '#fff' : '#000',
      }}
      key={item.text}
    >
      {item.text}
    </div>
  )

  render() {
    const { searchResults } = this.state;
    const { coordinates, inputValue } = this.props;
    const wrapperStyleWidth = `${coordinates.length > 0 ? '260px' : '291px'}`;

    return (
      <div className="geosearch-input-container">
        <Autocomplete
          // eslint-disable-next-line no-return-assign
          ref={(el) => this.input = el}
          inputProps={{
            className: 'form-control geosearch-autocomplete',
            id: 'geosearch-autocomplete',
            placeholder: 'Search for places and coordinates',
          }}
          wrapperStyle={{
            width: wrapperStyleWidth,
          }}
          value={inputValue}
          items={searchResults}
          getItemValue={(item) => item.text}
          onSelect={this.onSelect}
          onChange={this.onChange}
          renderMenu={this.renderMenu}
          renderItem={this.renderItem}
        />
      </div>
    );
  }
}

SearchBox.propTypes = {
  selectCoordinatesToFly: PropTypes.func,
  coordinates: PropTypes.array,
  inputValue: PropTypes.string,
  updateValue: PropTypes.func,
};

export default SearchBox;
