import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Button } from 'reactstrap';
import googleTagManager from 'googleTagManager';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getPermalink } from '../modules/link/util';
import { getSelectedDate } from '../modules/date/selectors';
import HoverTooltip from '../components/util/hover-tooltip';
import history from '../main';

function Embed (props) {
  const {
    isEmbedModeActive,
  } = props;

  const [showOverlay, clickOverlay] = useState(true);

  const newTabLink = function() {
    const { selectedDate } = props;
    const queryString = history.location.search || '';
    const permalink = getPermalink(queryString, selectedDate);
    googleTagManager.pushEvent({
      event: 'embed_open_new_tab',
    });
    window.open(permalink, '_blank');
  };

  const renderEmbedLinkBtn = function() {
    const { isMobile } = props;
    const buttonId = 'wv-embed-link-button';
    const labelText = 'Open this Worldview map in a new tab';
    return (
      <Button
        id={buttonId}
        className="wv-toolbar-button"
        aria-label={labelText}
        onClick={() => newTabLink()}
      >
        <HoverTooltip
          isMobile={isMobile}
          labelText={labelText}
          target={buttonId}
        />
        <FontAwesomeIcon icon="external-link-alt" size="2x" fixedWidth />
      </Button>
    );
  };

  return (
    isEmbedModeActive && (
      <>
        {showOverlay && (
          <>
            <div onClick={() => clickOverlay(false)} className="embed-overlay-bg" />
            <div className="embed-overlay-btn">
              <FontAwesomeIcon icon="hand-pointer" size="2x" fixedWidth />
              <p>Click anywhere to interact</p>
            </div>
          </>
        )}
        {renderEmbedLinkBtn()}
      </>
    )
  );
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
