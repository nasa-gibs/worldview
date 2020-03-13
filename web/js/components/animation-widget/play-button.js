import React from 'react';
import PropTypes from 'prop-types';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPause, faPlay } from '@fortawesome/free-solid-svg-icons';

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
        ? <FontAwesomeIcon icon={faPause} className="wv-animation-widget-icon" />
        : <FontAwesomeIcon icon={faPlay} className="wv-animation-widget-icon" />}
    </a>
  );
};

PlayButton.propTypes = {
  pause: PropTypes.func,
  play: PropTypes.func,
  playing: PropTypes.bool,
};

export default PlayButton;
