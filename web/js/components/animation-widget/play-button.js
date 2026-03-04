import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { UncontrolledTooltip } from 'reactstrap';

/*
 * @class PlayButton
 * @extends React.Component
 */
function PlayButton({
  playing, pause, play, isDisabled, isMobile,
}) {
  const buttonId = 'play-button';
  const isPlayingString = playing ? 'Pause animation' : 'Play animation';
  const labelText = isDisabled
    ? 'Too many animation frames. Reduce time range or increase increment size.'
    : isPlayingString;
  const isPlaying = playing ? pause : play;
  const onClick = isDisabled ? () => {} : isPlaying;

  return (
    <button
      id={buttonId}
      aria-label={labelText}
      type="button"
      className={`wv-anim-play-case wv-icon-case no-drag ${isDisabled ? 'disabled' : ''}`}
      onClick={onClick}
    >
      {!isMobile && 
        <UncontrolledTooltip
          id="center-align-tooltip"
          target={buttonId}
          placement="top"
        >
          {labelText}
        </UncontrolledTooltip>
      }
      {playing
        ? <FontAwesomeIcon icon="pause" className="wv-animation-widget-icon" widthAuto />
        : <FontAwesomeIcon icon="play" className="wv-animation-widget-icon" widthAuto />}
    </button>
  );
}

PlayButton.propTypes = {
  pause: PropTypes.func,
  play: PropTypes.func,
  playing: PropTypes.bool,
  isDisabled: PropTypes.bool,
  isMobile: PropTypes.bool,
};

export default PlayButton;
