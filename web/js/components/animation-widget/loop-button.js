/* eslint-disable react/destructuring-assignment */
import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { UncontrolledTooltip } from 'reactstrap';

/*
 * @class LoopButton
 * @extends React.Component
 */
function LoopButton({ looping, onLoop, isMobile }) {
  const labelText = looping ? 'Disable animation loop' : 'Enable animation loop';
  const buttonId = 'loop-button';
  return (
    <a
      id={buttonId}
      aria-label={labelText}
      className={
            looping
              ? 'wv-loop-icon-case wv-icon-case no-drag active'
              : 'wv-loop-icon-case wv-icon-case no-drag'
          }
      onClick={onLoop}
    >
      {isMobile ? null
        : (
          <UncontrolledTooltip
            id="center-align-tooltip"
            placement="top"
            target={buttonId}
          >
            {labelText}
          </UncontrolledTooltip>
        )}
      <FontAwesomeIcon icon="retweet" className="wv-animation-widget-icon" />
    </a>
  );
}

LoopButton.propTypes = {
  looping: PropTypes.bool,
  onLoop: PropTypes.func,
  isMobile: PropTypes.bool,
};

export default LoopButton;
