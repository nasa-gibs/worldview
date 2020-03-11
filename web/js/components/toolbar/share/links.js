import React from 'react';
import PropTypes from 'prop-types';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { faFacebookF, faTwitter, faRedditAlien } from '@fortawesome/free-brands-svg-icons';

class ShareLinks extends React.Component {
  onClick(event, type) {
    event.preventDefault();
    this.props.onClick(type);
  }

  render() {
    return (
      <div id="social-share" className="social-share">
        <a
          id="fb-share"
          className="icon-link social-icon-container-facebook"
          href="#"
          onClick={e => this.onClick(e, 'facebook')}
          title="Share via Facebook!"
        >
          <FontAwesomeIcon icon={faFacebookF} />
        </a>
        <a
          id="tw-share"
          className="icon-link social-icon-container-twitter"
          href="#"
          onClick={e => this.onClick(e, 'twitter')}
          title="Share via Twitter!"
        >
          <FontAwesomeIcon icon={faTwitter} />
        </a>
        <a
          id="rd-share"
          className="icon-link social-icon-container-reddit-alien"
          href="#"
          onClick={e => this.onClick(e, 'reddit')}
          title="Share via Reddit!"
        >
          <FontAwesomeIcon icon={faRedditAlien} />
        </a>
        <a
          id="email-share"
          className="icon-link social-icon-container-email"
          href="#"
          onClick={e => this.onClick(e, 'email')}
          title="Share via Email!"
        >
          <FontAwesomeIcon icon={faEnvelope} />
        </a>
      </div>
    );
  }
}

ShareLinks.propTypes = {
  onClick: PropTypes.func
};

export default ShareLinks;
