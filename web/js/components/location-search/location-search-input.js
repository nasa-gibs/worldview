import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Autocomplete from 'react-autocomplete';
import { Button, InputGroupAddon, UncontrolledTooltip } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

class SearchBox extends Component {
  constructor(props) {
    super(props);
    this.highlightedItem = null;
    this.locationSearchInput = null;
  }

  componentDidMount() {
    const {
      locationSearchMobileModalOpen,
      preventInputFocus,
      suggestions,
    } = this.props;
    // timeout necessary to trigger input focus
    if (!preventInputFocus || locationSearchMobileModalOpen) {
      setTimeout(() => {
        if (this.locationSearchInput) {
          this.locationSearchInput.focus();
          // handle hide results menu when expanding with pending suggestions
          if (suggestions.length > 0) {
            this.locationSearchInput.setState({ isOpen: false });
          }
        }
      }, 1);
    }
  }

  // handle submit button click - required to select coordinates since no suggestions menu
  handleSubmitClick = (e) => {
    e.preventDefault();
    const {
      coordinatesPending,
      onCoordinateInputSelect,
      onSelect,
      suggestions,
    } = this.props;
    if (coordinatesPending.length > 0) {
      onCoordinateInputSelect();
    } else if (suggestions.length > 0) {
      // submit highlighted item in search result menu
      if (this.highlightedItem) {
        onSelect(this.highlightedItem.text, this.highlightedItem);
      } else {
        // submit first of results, in the event desired text is input value
        // and the component is minimized then expanded
        const firstSuggestion = suggestions[0];
        onSelect(firstSuggestion.text, firstSuggestion);
      }
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
  renderMenu = (children) => (
    <div className="location-search-results-menu">
      {children}
    </div>
  )

  // render individual menu items with conditional styling
  renderItem = (item, isHighlighted) => {
    if (isHighlighted) {
      this.highlightedItem = item;
    }
    return (
      <div
        className="location-search-item highlighted-render-item"
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
      inputValue, isMobile,
    } = this.props;
    const buttonId = 'location-search-submit-button';
    const labelText = 'Submit and navigate to location';
    const buttonStyle = inputValue
      ? { background: isMobile ? '#d54e21' : 'none', color: isMobile ? '#fff' : '#d54e21', cursor: 'pointer' }
      : {};
    const tooltipVisibilityCondition = inputValue && !isMobile;

    return (
      <InputGroupAddon
        className="location-search-input-group-addon submit-group"
        addonType="prepend"
      >
        <Button
          id={buttonId}
          style={buttonStyle}
          disabled={!inputValue}
          onClick={this.handleSubmitClick}
          className={buttonId}
        >
          {tooltipVisibilityCondition && (
          <UncontrolledTooltip
            trigger="hover"
            target={buttonId}
            boundariesElement="window"
            placement="bottom"
          >
            {labelText}
          </UncontrolledTooltip>
          )}
          <FontAwesomeIcon icon="search-location" size="1x" />
        </Button>
      </InputGroupAddon>
    );
  }

  // render alert icon
  renderAlertIcon = () => {
    const {
      activeAlert,
    } = this.props;

    return (
      activeAlert && (
      <InputGroupAddon
        className="location-search-input-group-addon location-search-input-alert-icon"
        addonType="append"
        title="The entered location is not available."
      >
        <FontAwesomeIcon icon="exclamation-triangle" size="1x" />
      </InputGroupAddon>
      )
    );
  }

  // render clear input X
  renderClearInput = () => {
    const {
      inputValue, isMobile, clearInput,
    } = this.props;
    const buttonId = 'location-search-clear-button';
    const labelText = 'Clear search text';
    const tooltipVisibilityCondition = inputValue && !isMobile;

    return (
      inputValue && (
      <InputGroupAddon
        className="location-search-input-group-addon location-search-input-clear-container"
        addonType="append"
      >
        <Button
          id={buttonId}
          onClick={clearInput}
          className={buttonId}
        >
          {tooltipVisibilityCondition && (
          <UncontrolledTooltip
            trigger="hover"
            target={buttonId}
            boundariesElement="window"
            placement="bottom"
          >
            {labelText}
          </UncontrolledTooltip>
          )}
          <FontAwesomeIcon icon="times" size="1x" />
        </Button>
      </InputGroupAddon>
      )
    );
  }

  // conditional autocomplete wrapper styling
  getWrapperStyle = () => {
    const {
      inputValue,
      isMobile,
      activeAlert,
    } = this.props;

    // handle mobile/desktop input padding with/without alert
    const paddingRightStyle = inputValue
      ? activeAlert
        ? isMobile ? '68px' : '84px'
        : isMobile ? '42px' : '60px'
      : '0';

    return {
      width: isMobile ? '90%' : '298px',
      paddingRight: paddingRightStyle,
    };
  }

  render() {
    const {
      inputValue,
      isMobile,
      onChange,
      onSelect,
      suggestions,
    } = this.props;

    const placeHolderText = isMobile
      ? 'Enter place name or coordinates'
      : 'Search for places or enter coordinates';
    return (
      <div
        className="location-search-input-container"
        onKeyPress={this.handleKeyPress}
      >
        <Autocomplete
          ref={(el) => { this.locationSearchInput = el; }}
          inputProps={{
            className: 'form-control location-search-autocomplete',
            id: 'location-search-autocomplete',
            placeholder: placeHolderText,
          }}
          wrapperStyle={this.getWrapperStyle()}
          value={inputValue}
          items={suggestions}
          getItemValue={(item) => item.text}
          onSelect={onSelect}
          onChange={onChange}
          renderMenu={this.renderMenu}
          renderItem={this.renderItem}
        />
        {this.renderClearInput()}
        {this.renderAlertIcon()}
        {this.renderSubmitButton()}
      </div>
    );
  }
}

SearchBox.propTypes = {
  activeAlert: PropTypes.bool,
  clearInput: PropTypes.func,
  coordinatesPending: PropTypes.array,
  locationSearchMobileModalOpen: PropTypes.bool,
  inputValue: PropTypes.string,
  isMobile: PropTypes.bool,
  preventInputFocus: PropTypes.bool,
  onChange: PropTypes.func,
  onCoordinateInputSelect: PropTypes.func,
  onSelect: PropTypes.func,
  suggestions: PropTypes.array,
};

export default SearchBox;
