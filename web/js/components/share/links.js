import React from 'react';
import PropTypes from 'prop-types';

class ShareLinks extends React.Component {
  onClick(event, type) {
    event.preventDefault();
    this.props.onClick(type);
  }

  render() {
    return (
      <div id="social-share">
        <a id="fb-share" className="icon-link fa fa-facebook fa-2x" href={this.props.fbLink} onClick={(e) => this.onClick(e, 'facebook')} title="Share via Facebook!" />
        <a id="tw-share" className="icon-link fa fa-twitter fa-2x" href={this.props.twLink} onClick={(e) => this.onClick(e, 'twitter')} title="Share via Twitter!" />
        <a id="rd-share" className="icon-link fa fa-reddit fa-2x" href={this.props.rdLink} onClick={(e) => this.onClick(e, 'reddit')} title="Share via Reddit!" />
        <a id="email-share" className="icon-link fa fa-envelope fa-2x" href={this.props.emailLink} onClick={(e) => this.onClick(e, 'email')} title="Share via Email!" />
      </div>
    );
  }
}

ShareLinks.propTypes = {
  fbLink: PropTypes.string,
  twLink: PropTypes.string,
  rdLink: PropTypes.string,
  emailLink: PropTypes.string,
  onClick: PropTypes.func
};

export default ShareLinks;
