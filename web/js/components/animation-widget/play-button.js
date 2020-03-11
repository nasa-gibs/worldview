import React from 'react';
import PropTypes from 'prop-types';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPause, faPlay } from '@fortawesome/free-solid-svg-icons';

/*
 * @class PlayButton
 * @extends React.Component
 */
class PlayButton extends React.Component {
  render() {
    return (
      <a
        title={this.props.playing ? 'Pause video' : 'Play video'}
        className="wv-anim-play-case wv-icon-case"
        onClick={this.props.playing ? this.props.pause : this.props.play}
      >
        {this.props.playing
          ? <FontAwesomeIcon icon={faPause} className="wv-animation-widget-icon" />
          : <FontAwesomeIcon icon={faPlay} className="wv-animation-widget-icon" />
        }
      </a>
    );
  }
}

PlayButton.propTypes = {
  pause: PropTypes.func,
  play: PropTypes.func,
  playing: PropTypes.bool
};

export default PlayButton;
