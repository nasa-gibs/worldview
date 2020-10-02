import PropTypes from 'prop-types';
import React, { Component } from 'react';
import {
  ButtonGroup, Button, InputGroup, InputGroupAddon,
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearchLocation,
  faMapMarkerAlt,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import SearchBox from './geosearch-input';

class SearchComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      inputValue: '',
    };
  }

  updateValue = (inputValue) => {
    this.setState({
      inputValue,
    });
  }

  selectCoordinatesFromMap = (e) => {
    const { toggleReverseGeocodeActive } = this.props;
    e.preventDefault();
    toggleReverseGeocodeActive(true);
  }

  selectCoordinatesToFly = (coordinates) => {
    const { selectCoordinatesToFly } = this.props;
    selectCoordinatesToFly(coordinates);
  }

  render() {
    const {
      coordinates, clearCoordinates, shouldHide, toggleShowGeosearch,
    } = this.props;
    const { inputValue } = this.state;
    const hasCoordinates = coordinates.length > 0;
    const textEntered = inputValue;
    const containerClass = `geosearch-component-expanded-search ${!shouldHide ? 'expanded' : ''}`;

    return (
      <div className={containerClass}>
        <div style={{
          background: 'rgba(40, 40, 40, 0.85)',
          borderRadius: '5px',
        }}
        >
          <InputGroup
            className="geosearch-search-input-group"
          >
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
              selectCoordinatesToFly={this.selectCoordinatesToFly}
              isCoordinateSearchActive={false}
              updateValue={this.updateValue}
              inputValue={inputValue}
            />
            <InputGroupAddon className={`geosearch-search-submit-container ${hasCoordinates ? 'grouped' : ''}`} addonType="append">
              <Button
                style={{
                  color: `${textEntered ? '#0070c8' : ''}`,
                  left: `${hasCoordinates ? '256px' : '287px'}`,
                }}
                disabled={!textEntered}
                className="geosearch-search-submit-button"
                title="Search by place name or reverse search using coordinates"
              >
                <FontAwesomeIcon icon={faSearchLocation} size="1x" />
              </Button>
            </InputGroupAddon>
            <InputGroupAddon addonType="append" className={`geosearch-coordinate-group-container ${hasCoordinates ? 'grouped' : ''}`}>
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
      </div>
    );
  }
}

SearchComponent.propTypes = {
  coordinates: PropTypes.array,
  selectCoordinatesToFly: PropTypes.func,
  toggleReverseGeocodeActive: PropTypes.func,
  clearCoordinates: PropTypes.func,
  shouldHide: PropTypes.bool,
  toggleShowGeosearch: PropTypes.func,
};

export default SearchComponent;
