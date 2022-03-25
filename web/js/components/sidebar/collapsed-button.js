import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { UncontrolledTooltip } from 'reactstrap';

class CollapsedButton extends PureComponent {
  render() {
    const {
      isMobile,
      numberOfLayers,
      onclick,
    } = this.props;
    const buttonId = 'accordion-toggler-button';
    const labelText = 'Expand sidebar';

    return (
      <div
        id="productsHoldertoggleButtonHolder"
        className="sidebar-expand"
      >
        <a
          id={buttonId}
          aria-label={labelText}
          className="accordionToggler staticLayers"
          onClick={onclick}
        >
          <UncontrolledTooltip placement="right" target={buttonId}>
            {labelText}
          </UncontrolledTooltip>
          <FontAwesomeIcon className="layer-icon" icon="layer-group" />
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
          {!isMobile && <FontAwesomeIcon className="expand-icon" icon="caret-down" />}
        </a>
      </div>
    );
  }
}
CollapsedButton.propTypes = {
  isMobile: PropTypes.bool,
  numberOfLayers: PropTypes.number,
  onclick: PropTypes.func,
};

export default CollapsedButton;
