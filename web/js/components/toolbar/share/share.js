import React from 'react';
import PropTypes from 'prop-types';
import ShareLinks from './links';

class Share extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      fbLink: props.fbLink,
      twLink: props.twLink,
      rdLink: props.rdLink,
      emailLink: props.emailLink,
    };
  }

  render() {
    const {
      fbLink, twLink, rdLink, emailLink,
    } = this.state;
    const { clickFunction } = this.props;
    return (
      <div>
        <ShareLinks
          fbLink={fbLink}
          twLink={twLink}
          rdLink={rdLink}
          emailLink={emailLink}
          onClick={clickFunction}
        />
      </div>
    );
  }
}

Share.propTypes = {
  clickFunction: PropTypes.func,
  emailLink: PropTypes.string,
  fbLink: PropTypes.string,
  rdLink: PropTypes.string,
  twLink: PropTypes.string,
};

export default Share;
