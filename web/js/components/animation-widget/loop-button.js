import React from 'react';
import PropTypes from 'prop-types';

/*
 * @class LoopButton
 * @extends React.Component
 */
class LoopButton extends React.Component {
  render() {
    return (
      <a
        title={this.props.looping ? 'Stop Loop' : 'Loop video'}
        className={
          this.props.looping
            ? 'wv-loop-icon-case wv-icon-case active'
            : 'wv-loop-icon-case wv-icon-case'
        }
        onClick={this.props.onLoop}
      >
        <i className="fa fa-retweet wv-animation-widget-icon" />
      </a>
    );
  }
}

LoopButton.propTypes = {
  looping: PropTypes.bool,
  onLoop: PropTypes.func
};

export default LoopButton;
