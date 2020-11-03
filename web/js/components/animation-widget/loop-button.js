/* eslint-disable react/destructuring-assignment */
import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

/*
 * @class LoopButton
 * @extends React.Component
 */
const LoopButton = (props) => (
  <a
    title={props.looping ? 'Stop Loop' : 'Loop video'}
    className={
          props.looping
            ? 'wv-loop-icon-case wv-icon-case active'
            : 'wv-loop-icon-case wv-icon-case'
        }
    onClick={props.onLoop}
  >
    <FontAwesomeIcon icon="retweet" className="wv-animation-widget-icon" />
  </a>
);

LoopButton.propTypes = {
  looping: PropTypes.bool,
  onLoop: PropTypes.func,
};

export default LoopButton;
