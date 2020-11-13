import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Autocomplete from 'react-autocomplete';
import { Button, InputGroupAddon, UncontrolledTooltip } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

class SearchBox extends Component {
  constructor(props) {
    super(props);
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
      inputValue, isMobile,
    } = this.props;
    const buttonId = 'geosearch-search-submit-button';
    const labelText = 'Submit and navigate to location';
    const rightPositioning = '31px';
    const buttonStyle = inputValue
      ? { background: isMobile ? '#d54e21' : 'none', color: isMobile ? '#fff' : '#d54e21', cursor: 'pointer' }
      : {};
    const tooltipVisibilityCondition = inputValue && !isMobile;

    return (
      <InputGroupAddon
        className="geosearch-submit-input-group-addon"
        addonType="prepend"
        style={{
          right: rightPositioning,
        }}
      >
        <Button
          id={buttonId}
          style={buttonStyle}
          disabled={!inputValue}
          onClick={this.handleSubmitClick}
          className="geosearch-search-submit-button"
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
      showExtentAlert, isMobile,
    } = this.props;
    const rightPositioning = isMobile ? '130px' : '120px';

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
    const rightPositioning = isMobile ? '70px' : '62px';
    const buttonId = 'geosearch-search-clear-button';
    const labelText = 'Clear search text';
    const tooltipVisibilityCondition = inputValue && !isMobile;

    return (
      inputValue && (
      <InputGroupAddon
        className="geosearch-submit-input-group-addon"
        addonType="append"
        style={{
          right: rightPositioning,
        }}
      >
        <Button
          id={buttonId}
          onClick={clearInput}
          className="geosearch-search-clear-button"
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

  // condtional autocomplete wrapper styling
  getWrapperStyle = () => {
    const {
      isMobile,
      showExtentAlert,
      inputValue,
    } = this.props;

    const paddingRightStyle = inputValue
      ? showExtentAlert
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
        {this.renderClearInput()}
        {this.renderAlertIcon()}
        {this.renderSubmitButton()}
      </div>
    );
  }
}

SearchBox.propTypes = {
  clearInput: PropTypes.func,
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
