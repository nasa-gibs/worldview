import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

class ShareLinks extends React.Component {
  onClick(event, type) {
    const { onClick } = this.props;
    event.preventDefault();
    onClick(type);
  }

  render() {
    return (
      <div id="social-share" className="social-share">
        <a
          id="fb-share"
          className="icon-link social-icon-container-facebook"
          onClick={(e) => this.onClick(e, 'facebook')}
          title="Share via Facebook!"
        >
          <FontAwesomeIcon icon={['fab', 'facebook-f']} />
        </a>
        <a
          id="tw-share"
          className="icon-link social-icon-container-twitter"
          onClick={(e) => this.onClick(e, 'twitter')}
          title="Share via Twitter!"
        >
          <FontAwesomeIcon icon={['fab', 'twitter']} />
        </a>
        <a
          id="rd-share"
          className="icon-link social-icon-container-reddit-alien"
          onClick={(e) => this.onClick(e, 'reddit')}
          title="Share via Reddit!"
        >
          <FontAwesomeIcon icon={['fab', 'reddit-alien']} />
        </a>
        <a
          id="email-share"
          className="icon-link social-icon-container-email"
          onClick={(e) => this.onClick(e, 'email')}
          title="Share via Email!"
        >
          <FontAwesomeIcon icon="envelope" />
        </a>
      </div>
    );
  }
}

ShareLinks.propTypes = {
  onClick: PropTypes.func,
};

export default ShareLinks;
