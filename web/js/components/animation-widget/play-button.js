import React from 'react';
import PropTypes from 'prop-types';

/*
 * A react component, Builds a rather specific
 * interactive widget
 *
 * @class AnimationWidget
 * @extends React.Component
 */
class PlayButton extends React.Component {
  render() {
    return (
      <a href="javascript:void(null)" title={this.props.playing ? 'Pause video' : 'Play video'}
        className='wv-anim-play-case wv-icon-case'
        onClick={this.props.playing ? this.props.pause : this.props.play}
      >
        <i className={this.props.playing ? 'fa fa-pause wv-animation-widget-icon' : 'fa fa-play wv-animation-widget-icon'} />
      </a>
    );
  }
}

PlayButton.propTypes = {
  playing: PropTypes.bool,
  pause: PropTypes.func,
  play: PropTypes.func
};

export default PlayButton;
