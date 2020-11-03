import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

class CollapsedButton extends PureComponent {
  render() {
    const {
      isMobile,
      isDistractionFreeModeActive,
      isCollapsed,
      numberOfLayers,
      onclick,
    } = this.props;

    return (
      <div
        id="productsHoldertoggleButtonHolder"
        className="toggleButtonHolder"
        style={!isCollapsed || isDistractionFreeModeActive ? { display: 'none' } : {}}
      >
        <a
          id="accordionTogglerButton"
          className="accordionToggler dateHolder staticLayers"
          title="Show Layer Selector"
          onClick={onclick}
        >
          <FontAwesomeIcon icon="layer-group" />
          {isMobile
            ? (
              <span className="layer-count mobile">
                {numberOfLayers.toString()}
              </span>
            )
            : (
              <span className="layer-count ">
                {numberOfLayers.toString()}
                {' '}
                Layers
              </span>
            )}
        </a>
      </div>
    );
  }
}
CollapsedButton.propTypes = {
  isCollapsed: PropTypes.bool,
  isDistractionFreeModeActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  numberOfLayers: PropTypes.number,
  onclick: PropTypes.func,
};

export default CollapsedButton;
