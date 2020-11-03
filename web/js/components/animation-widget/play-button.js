import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { UncontrolledTooltip } from 'reactstrap';

/*
 * @class PlayButton
 * @extends React.Component
 */
const PlayButton = (props) => {
  const { playing, pause, play } = props;
  const buttonId = 'play-button';
  const labelText = playing ? 'Pause animation' : 'Play animation';
  return (
    <a
      id={buttonId}
      aria-label={labelText}
      className="wv-anim-play-case wv-icon-case"
      onClick={playing ? pause : play}
    >
      <UncontrolledTooltip
        target={buttonId}
        placement="top"
      >
        {labelText}
      </UncontrolledTooltip>
      {playing
        ? <FontAwesomeIcon icon="pause" className="wv-animation-widget-icon" />
        : <FontAwesomeIcon icon="play" className="wv-animation-widget-icon" />}
    </a>
  );
};

PlayButton.propTypes = {
  pause: PropTypes.func,
  play: PropTypes.func,
  playing: PropTypes.bool,
};

export default PlayButton;
