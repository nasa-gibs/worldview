import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { UncontrolledTooltip } from 'reactstrap';

class CollapsedButton extends PureComponent {
  render() {
    const {
      isMobile,
      isDistractionFreeModeActive,
      numberOfLayers,
      onclick,
    } = this.props;
    const buttonId = 'accordion-toggler-button';
    const labelText = 'Expand sidebar';

    return !isDistractionFreeModeActive && (
      <div
        id="productsHoldertoggleButtonHolder"
        className="toggleButtonHolder"
      >
        <a
          id={buttonId}
          aria-label={labelText}
          className="accordionToggler dateHolder staticLayers"
          onClick={onclick}
        >
          <UncontrolledTooltip placement="right" target={buttonId}>
            {labelText}
          </UncontrolledTooltip>
          <FontAwesomeIcon icon="layer-group" />
          {isMobile
            ? (
              <span className="layer-count mobile">
                {numberOfLayers.toString()}
              </span>
            )
            : (
              <span className="layer-count ">
                {`${numberOfLayers.toString()} Layers`}
              </span>
            )}
        </a>
      </div>
    );
  }
}
CollapsedButton.propTypes = {
  isDistractionFreeModeActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  numberOfLayers: PropTypes.number,
  onclick: PropTypes.func,
};

export default CollapsedButton;
