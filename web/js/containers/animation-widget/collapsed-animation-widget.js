import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Draggable from 'react-draggable';
import PlayButton from '../../components/animation-widget/play-button';

function CollapsedAnimationWidget (props) {
  const {
    breakpoints,
    collapsedWidgetPosition,
    handleDragStart,
    hasSubdailyLayers,
    isLandscape,
    isMobile,
    isMobilePhone,
    isMobileTablet,
    isPlaying,
    isPortrait,
    onClose,
    onCollapsedDrag,
    onPushPause,
    onPushPlay,
    playDisabled,
    screenWidth,
    toggleCollapse,
  } = props;

  const cancelSelector = '.no-drag, svg';
  const dontShow = isMobile && playDisabled;
  const widgetClasses = 'wv-animation-widget-wrapper minimized '
    + `${hasSubdailyLayers ? 'subdaily ' : ''}`
    + `${isMobile ? 'mobile ' : ''}`
    + `${isLandscape ? 'landscape ' : ''}`;
  const subdailyID = hasSubdailyLayers ? '-subdaily' : '';

  const getWidgetIDs = () => {
    if ((isMobilePhone && isPortrait) || (!isMobileTablet && screenWidth < 670 && hasSubdailyLayers) || (!isMobileTablet && screenWidth < 575 && !hasSubdailyLayers)) {
      return `-phone-portrait${subdailyID}`;
    } if (isMobilePhone && isLandscape) {
      return `-phone-landscape${subdailyID}`;
    } if ((isMobileTablet && isPortrait) || (!isMobilePhone && screenWidth < breakpoints.small)) {
      return `-tablet-portrait${subdailyID}`;
    } if (isMobileTablet && isLandscape) {
      return `-tablet-landscape${subdailyID}`;
    }
  };

  const widgetIDs = getWidgetIDs();

  return !dontShow && (
    <Draggable
      bounds="body"
      cancel={cancelSelector}
      onStart={handleDragStart}
      position={collapsedWidgetPosition}
      onDrag={onCollapsedDrag}
      disabled={isMobile}
    >
      <div
        className={widgetClasses}
        id={`collapsed-animate-widget${widgetIDs}`}
      >
        <div
          id="wv-animation-widget"
          className="wv-animation-widget minimized"
        >
          <PlayButton
            playing={isPlaying}
            play={onPushPlay}
            pause={onPushPause}
            isDisabled={playDisabled}
            isMobile={isMobile}
          />
          {!isMobile && <FontAwesomeIcon icon="chevron-up" className="wv-expand" onClick={toggleCollapse} /> }
          {!isMobile && <FontAwesomeIcon icon="times" className="wv-close" onClick={onClose} /> }
        </div>
      </div>
    </Draggable>
  );
}

CollapsedAnimationWidget.propTypes = {
  breakpoints: PropTypes.object,
  collapsedWidgetPosition: PropTypes.object,
  handleDragStart: PropTypes.func,
  hasSubdailyLayers: PropTypes.bool,
  isLandscape: PropTypes.bool,
  isMobile: PropTypes.bool,
  isMobilePhone: PropTypes.bool,
  isMobileTablet: PropTypes.bool,
  isPlaying: PropTypes.bool,
  isPortrait: PropTypes.bool,
  onClose: PropTypes.func,
  onCollapsedDrag: PropTypes.func,
  onPushPause: PropTypes.func,
  onPushPlay: PropTypes.func,
  playDisabled: PropTypes.bool,
  screenWidth: PropTypes.number,
  toggleCollapse: PropTypes.func,
};

export default CollapsedAnimationWidget;
