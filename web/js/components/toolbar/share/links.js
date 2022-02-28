import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import HoverTooltip from '../../util/hover-tooltip';

class ShareLinks extends React.Component {
  onClick(event, type) {
    const { onClick } = this.props;
    event.preventDefault();
    onClick(type);
  }

  render() {
    const { isMobile } = this.props;
    return (
      <div id="social-share" className="social-share">
        <a
          id="fb-share"
          className="icon-link social-icon-container-facebook"
          onClick={(e) => this.onClick(e, 'facebook')}
        >
          <HoverTooltip
            isMobile={isMobile}
            labelText="Share on Facebook!"
            placement="left-end"
            target="fb-share"
            fade={false}
          />
          <FontAwesomeIcon icon={['fab', 'facebook-f']} />
        </a>
        <a
          id="tw-share"
          className="icon-link social-icon-container-twitter"
          onClick={(e) => this.onClick(e, 'twitter')}
        >
          <HoverTooltip
            isMobile={isMobile}
            labelText="Share on Twitter!"
            placement="left-end"
            target="tw-share"
            fade={false}
          />
          <FontAwesomeIcon icon={['fab', 'twitter']} />
        </a>
        <a
          id="rd-share"
          className="icon-link social-icon-container-reddit-alien"
          onClick={(e) => this.onClick(e, 'reddit')}
        >
          <HoverTooltip
            isMobile={isMobile}
            labelText="Share on Reddit!"
            placement="left-end"
            target="rd-share"
            fade={false}
          />
          <FontAwesomeIcon icon={['fab', 'reddit-alien']} />
        </a>
        <a
          id="email-share"
          className="icon-link social-icon-container-email"
          onClick={(e) => this.onClick(e, 'email')}
        >
          <HoverTooltip
            isMobile={isMobile}
            labelText="Share via Email!"
            placement="left-end"
            target="email-share"
            fade={false}
          />
          <FontAwesomeIcon icon="envelope" />
        </a>
      </div>
    );
  }
}

ShareLinks.propTypes = {
  isMobile: PropTypes.bool,
  onClick: PropTypes.func,
};

export default ShareLinks;
