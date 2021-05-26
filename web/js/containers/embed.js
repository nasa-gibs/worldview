import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Button } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getPermalink } from '../modules/link/util';
import getSelectedDate from '../modules/date/selectors';
import HoverTooltip from '../components/util/hover-tooltip';
import history from '../main';

class Embed extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showOverlay: true,
    };
    this.clickOverlay = this.clickOverlay.bind(this);
    this.renderEmbedLinkBtn = this.renderEmbedLinkBtn.bind(this);
    this.newTabLink = this.newTabLink.bind(this);
  }

  clickOverlay() {
    this.setState({ showOverlay: false });
  }

  newTabLink() {
    const { selectedDate } = this.props;
    const queryString = history.location.search || '';
    const permalink = getPermalink(queryString, selectedDate);
    window.open(permalink, '_blank');
  }

  renderEmbedLinkBtn() {
    const { isMobile } = this.props;
    const buttonId = 'wv-embed-button';
    const labelText = 'Open new tab with content in Worldview';
    return (
      <Button
        id={buttonId}
        className="wv-toolbar-button"
        aria-label={labelText}
        onClick={() => this.newTabLink()}
      >
        <HoverTooltip
          isMobile={isMobile}
          labelText={labelText}
          target={buttonId}
        />
        <FontAwesomeIcon icon="external-link-alt" size="2x" fixedWidth />
      </Button>
    );
  }

  render() {
    const { isEmbedModeActive } = this.props;
    const { showOverlay } = this.state;
    return (
      isEmbedModeActive && (
        <>
          {showOverlay && (
            <>
              <div onClick={() => this.clickOverlay()} className="embed-overlay-bg" />
              <div className="embed-overlay-btn">
                <FontAwesomeIcon icon="hand-pointer" size="2x" fixedWidth />
                <p>Click anywhere to interact</p>
              </div>
            </>
          )}
          {this.renderEmbedLinkBtn()}
        </>
      )
    );
  }
}

function mapStateToProps(state) {
  const { browser, embed } = state;
  const { isEmbedModeActive } = embed;
  const isMobile = browser.lessThan.medium;

  return {
    isEmbedModeActive,
    isMobile,
    selectedDate: getSelectedDate(state),
  };
}

export default connect(
  mapStateToProps,
  null,
)(Embed);

Embed.propTypes = {
  isEmbedModeActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  selectedDate: PropTypes.object,
};
