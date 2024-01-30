import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Button } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import googleTagManager from 'googleTagManager';
import { getPermalink } from '../modules/link/util';
import { getSelectedDate } from '../modules/date/selectors';
import HoverTooltip from '../components/util/hover-tooltip';
import history from '../main';

function Embed ({ isEmbedModeActive, selectedDate, isMobile }) {
  const [showClickToInteractMessage, setShowClickToInteractMessage] = useState(false);
  const [hasClicked, setHasClicked] = useState(false);

  const handleOverlayClick = () => {
    setShowClickToInteractMessage(false);
    setHasClicked(true);
  };

  const newTabLink = function() {
    const queryString = history.location.search || '';
    const permalink = getPermalink(queryString, selectedDate);
    googleTagManager.pushEvent({
      event: 'embed_open_new_tab',
    });
    window.open(permalink, '_blank');
  };

  const renderEmbedLinkBtn = function() {
    const buttonId = 'wv-embed-link-button';
    const labelText = 'Open this @NAME@ map in a new tab';
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
      <div
        id={!hasClicked ? 'embed-mode-wrapper' : ''}
        onMouseEnter={() => !hasClicked && setShowClickToInteractMessage(true)}
        onMouseLeave={() => !hasClicked && setShowClickToInteractMessage(false)}
      >
        {showClickToInteractMessage && (
          <>
            <div onClick={handleOverlayClick} className="embed-overlay-bg" />
            <div className="embed-overlay-btn">
              <FontAwesomeIcon icon="hand-pointer" size="2x" fixedWidth />
              <p>Click anywhere to interact</p>
            </div>
          </>
        )}
        {renderEmbedLinkBtn()}
      </div>
    )
  );
}

function mapStateToProps(state) {
  const { screenSize, embed } = state;
  const { isEmbedModeActive } = embed;
  const isMobile = screenSize.isMobileDevice;

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
