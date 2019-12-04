import React from 'react';
import PropTypes from 'prop-types';

class CollapsedButton extends React.Component {
  render() {
    const { isCollapsed, isDistractionFreeModeActive, numberOfLayers, onclick } = this.props;

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
          {'Layers (' + numberOfLayers.toString() + ')'}
        </a>
      </div>
    );
  }
}
CollapsedButton.propTypes = {
  isCollapsed: PropTypes.bool,
  isDistractionFreeModeActive: PropTypes.bool,
  numberOfLayers: PropTypes.number,
  onclick: PropTypes.func
};

export default CollapsedButton;
