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
      emailLink: props.emailLink
    };
  }

  render() {
    return (
      <div>
        <ShareLinks
          fbLink={this.state.fbLink}
          twLink={this.state.twLink}
          rdLink={this.state.rdLink}
          emailLink={this.state.emailLink}
          onClick={this.props.clickFunction}
        />
      </div>
    );
  }
}

Share.propTypes = {
  fbLink: PropTypes.string,
  twLink: PropTypes.string,
  rdLink: PropTypes.string,
  emailLink: PropTypes.string,
  clickFunction: PropTypes.func
};

export default Share;
