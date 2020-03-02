import React from 'react';
import PropTypes from 'prop-types';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLayerGroup } from '@fortawesome/free-solid-svg-icons';

class CollapsedButton extends React.Component {
  render() {
    const {
      isMobile,
      isCollapsed,
      numberOfLayers,
      onclick
    } = this.props;

    return (
      <div
        id="productsHoldertoggleButtonHolder"
        className="toggleButtonHolder"
        style={!isCollapsed ? { display: 'none' } : {}}
      >
        <a
          id="accordionTogglerButton"
          className="accordionToggler dateHolder staticLayers"
          title="Show Layer Selector"
          onClick={onclick}
        >
          <FontAwesomeIcon icon={faLayerGroup} />
          {isMobile
            ? (
              <span className='layer-count mobile'>
                {numberOfLayers.toString()}
              </span>
            )
            : (
              <span className='layer-count '>
                {numberOfLayers.toString()} Layers
              </span>
            )
          }
        </a>
      </div>
    );
  }
}
CollapsedButton.propTypes = {
  isCollapsed: PropTypes.bool,
  isMobile: PropTypes.bool,
  numberOfLayers: PropTypes.number,
  onclick: PropTypes.func
};

export default CollapsedButton;
