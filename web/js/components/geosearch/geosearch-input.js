import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Autocomplete from 'react-autocomplete';
import { Button, InputGroupAddon } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faSearchLocation } from '@fortawesome/free-solid-svg-icons';

class SearchBox extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
    this.highlightedItem = null;
    this.geosearchInput = null;
  }

  componentDidMount() {
    const { geosearchMobileModalOpen, isExpanded } = this.props;
    // timeout necessary to trigger input focus
    if (isExpanded || geosearchMobileModalOpen) {
      setTimeout(() => {
        if (this.geosearchInput) {
          this.geosearchInput.focus();
        }
      }, 1);
    }
  }

  // handle submit button click - required to select coordinates since no suggestions menu
  handleSubmitClick = (e) => {
    e.preventDefault();
    const {
      onSelect, coordinatesPending, onCoordinateInputSelect, searchResults,
    } = this.props;
    if (coordinatesPending.length > 0) {
      onCoordinateInputSelect();
    } else if (searchResults.length > 0 && this.highlightedItem) {
      onSelect(this.highlightedItem.text, this.highlightedItem);
    }
  }

  // handle key press to use ENTER key to select
  handleKeyPress = (e) => {
    const { coordinatesPending, onCoordinateInputSelect } = this.props;
    // check tab and enter key code
    const { charCode } = e;
    const entered = charCode === 13;
    if (entered) {
      e.preventDefault();
      e.stopPropagation();

      if (coordinatesPending.length > 0) {
        onCoordinateInputSelect();
      }
    }
  }

  // render search result menu item container
  renderMenu= (children) => (
    <div className="geosearch-results-menu">
      {children}
    </div>
  )

  // render individual menu items with conditional styling
  renderItem=(item, isHighlighted) => {
    if (isHighlighted) {
      this.highlightedItem = item;
    }
    return (
      <div
        className="geosearch-item highlighted-render-item"
        style={{
          background: isHighlighted ? '#0070c8' : '#fff',
          color: isHighlighted ? '#fff' : '#000',
        }}
        key={item.text}
      >
        {item.text}
      </div>
    );
  }

  // render submit button
  renderSubmitButton = () => {
    const {
      coordinates, inputValue, isMobile,
    } = this.props;
    const hasCoordinates = coordinates.length > 0;
    // eslint-disable-next-line no-nested-ternary
    const rightPositioning = hasCoordinates
      ? isMobile ? '67px' : '60px'
      : '30px';
    const buttonStyle = inputValue
      ? { color: '#0070c8', cursor: 'pointer' }
      : {};

    return (
      <InputGroupAddon
        className="geosearch-submit-input-group-addon"
        addonType="append"
        style={{
          right: rightPositioning,
        }}
      >
        <Button
          style={buttonStyle}
          disabled={!inputValue}
          onClick={this.handleSubmitClick}
          className="geosearch-search-submit-button"
          title="Search by place name or reverse search using coordinates"
        >
          <FontAwesomeIcon icon={faSearchLocation} size="1x" />
        </Button>
      </InputGroupAddon>
    );
  }

  // render alert icon
  renderAlertIcon = () => {
    const {
      coordinates, isMobile, showExtentAlert,
    } = this.props;
    const hasCoordinates = coordinates.length > 0;
    // eslint-disable-next-line no-nested-ternary
    const rightPositioning = hasCoordinates
      ? isMobile ? '121px' : '121px'
      : '92px';

    return (
      showExtentAlert && (
      <InputGroupAddon
        className="geosearch-submit-input-group-addon"
        addonType="append"
        style={{
          right: rightPositioning,
        }}
        title="The entered location is outside of the current map extent."
      >
        <FontAwesomeIcon icon={faExclamationTriangle} size="1x" />
      </InputGroupAddon>
      )
    );
  }

  // condtional autocomplete wrapper styling
  getWrapperStyle = () => {
    const {
      coordinates,
      isMobile,
      showExtentAlert,
    } = this.props;
    const hasCoordinates = coordinates.length > 0;
    const wrapperStyleWidth = hasCoordinates ? '268px' : '299px';
    return {
      width: isMobile ? '90%' : wrapperStyleWidth,
      // eslint-disable-next-line no-nested-ternary
      paddingRight: isMobile
        ? '0'
        : showExtentAlert ? '53px' : '26px',
    };
  }

  render() {
    const {
      inputValue,
      isMobile,
      onChange,
      onSelect,
      searchResults,
    } = this.props;

    const placeHolderText = isMobile
      ? 'Enter place name or coordinates'
      : 'Search for places or enter coordinates';
    return (
      <div
        className="geosearch-input-container"
        onKeyPress={this.handleKeyPress}
      >
        <Autocomplete
          // eslint-disable-next-line no-return-assign
          ref={(el) => this.geosearchInput = el}
          inputProps={{
            className: 'form-control geosearch-autocomplete dark-input',
            id: 'geosearch-autocomplete',
            placeholder: placeHolderText,
          }}
          wrapperStyle={this.getWrapperStyle()}
          value={inputValue}
          items={searchResults}
          getItemValue={(item) => item.text}
          onSelect={onSelect}
          onChange={onChange}
          renderMenu={this.renderMenu}
          renderItem={this.renderItem}
        />
        {this.renderAlertIcon()}
        {this.renderSubmitButton()}
      </div>
    );
  }
}

SearchBox.propTypes = {
  coordinates: PropTypes.array,
  coordinatesPending: PropTypes.array,
  onCoordinateInputSelect: PropTypes.func,
  searchResults: PropTypes.array,
  geosearchMobileModalOpen: PropTypes.bool,
  inputValue: PropTypes.string,
  isExpanded: PropTypes.bool,
  isMobile: PropTypes.bool,
  onSelect: PropTypes.func,
  onChange: PropTypes.func,
  showExtentAlert: PropTypes.bool,
};

export default SearchBox;
