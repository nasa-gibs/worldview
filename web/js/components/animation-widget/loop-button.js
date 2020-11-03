/* eslint-disable react/destructuring-assignment */
import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { UncontrolledTooltip } from 'reactstrap';

/*
 * @class LoopButton
 * @extends React.Component
 */
const LoopButton = ({ looping, onLoop }) => {
  const labelText = looping ? 'Disable animation loop' : 'Enable animation loop';
  const buttonId = 'loop-button';
  return (
    <a
      id={buttonId}
      aria-label={labelText}
      className={
            looping
              ? 'wv-loop-icon-case wv-icon-case active'
              : 'wv-loop-icon-case wv-icon-case'
          }
      onClick={onLoop}
    >
      <UncontrolledTooltip
        placement="right"
        target={buttonId}
      >
        {labelText}
      </UncontrolledTooltip>
      <FontAwesomeIcon icon="retweet" className="wv-animation-widget-icon" />
    </a>
  );
};

LoopButton.propTypes = {
  looping: PropTypes.bool,
  onLoop: PropTypes.func,
};

export default LoopButton;
