import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { UncontrolledTooltip } from 'reactstrap';

class CollapsedButton extends PureComponent {
  render() {
    const {
      isEmbed,
      isMobile,
      numberOfLayers,
      onclick,
    } = this.props;
    const buttonId = 'accordion-toggler-button';
    const labelText = 'Expand sidebar';
    const classes = `sidebar-expand ${isMobile && !isEmbed ? 'mobile' : ''}`;

    return (
      <div
        className={classes}
      >
        <a
          id={buttonId}
          aria-label={labelText}
          onClick={onclick}
          className="sidebar-anchor"
        >
          <UncontrolledTooltip id="center-align-tooltip" placement="right" target={buttonId}>
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
  isEmbed: PropTypes.bool,
  isMobile: PropTypes.bool,
  numberOfLayers: PropTypes.number,
  onclick: PropTypes.func,
};

export default CollapsedButton;
