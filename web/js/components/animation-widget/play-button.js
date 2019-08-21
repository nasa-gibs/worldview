import React from 'react';
import PropTypes from 'prop-types';

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
        <i
          className={
            this.props.playing
              ? 'fa fa-pause wv-animation-widget-icon'
              : 'fa fa-play wv-animation-widget-icon'
          }
        />
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
