import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

/*
 * @class PlayButton
 * @extends React.Component
 */
const PlayButton = (props) => {
  const { playing, pause, play } = props;
  return (
    <a
      title={playing ? 'Pause video' : 'Play video'}
      className="wv-anim-play-case wv-icon-case"
      onClick={playing ? pause : play}
    >
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
