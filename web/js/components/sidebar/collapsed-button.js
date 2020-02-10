import React from 'react';
import PropTypes from 'prop-types';

class CollapsedButton extends React.Component {
  render() {
    const { isCollapsed, numberOfLayers, onclick } = this.props;

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
          <i className="fa fa-layer-group" aria-hidden="true"></i>
          <span className='layer-count'>
            {numberOfLayers.toString()}
          </span>
        </a>
      </div>
    );
  }
}
CollapsedButton.propTypes = {
  isCollapsed: PropTypes.bool,
  numberOfLayers: PropTypes.number,
  onclick: PropTypes.func
};

export default CollapsedButton;
