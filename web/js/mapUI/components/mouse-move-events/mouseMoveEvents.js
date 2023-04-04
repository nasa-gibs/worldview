import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  throttle as lodashThrottle,
} from 'lodash';
import util from '../../../util/util';
import {
  MAP_MOUSE_MOVE,
  MAP_MOUSE_OUT,
} from '../../../util/constants';

const { events } = util;

function MouseMoveEvents(props) {
  const {
    isCoordinateSearchActive,
    isEventsTabActive,
    isMobile,
    isMeasureActive,
    isMapAnimating,
    sidebarActiveTab,
    map,
    ui,
    compareMapUi,
  } = props;

  const [mouseMove, setMouseMove] = useState({});

  const throttledOnMouseMove = lodashThrottle(({ pixel }) => {
    if (!map.ui.selected) return;

    const coords = ui.selected.getCoordinateFromPixel(pixel);

    if (map.ui.selected.proj !== ui.selected.proj) return;
    if (ui.mapIsbeingZoomed) return;
    if (ui.mapIsbeingDragged) return;
    if (compareMapUi && compareMapUi.dragging) return;
    if (isMobile) return;
    if (isMeasureActive) return;
    if (isCoordinateSearchActive) return;
    if (!coords) return;
    if (isEventsTabActive || isMapAnimating || sidebarActiveTab === 'download') return;
    ui.runningdata.newPoint(pixel, ui.selected);
  }, 300);

  useEffect(() => {
    throttledOnMouseMove(mouseMove);
  }, [mouseMove]);

  events.on(MAP_MOUSE_MOVE, setMouseMove);
  events.on(MAP_MOUSE_OUT, (e) => {
    throttledOnMouseMove.cancel();
    ui.runningdata.clearAll();
  });

  return null;
}

const mapStateToProps = (state) => {
  const {
    events, locationSearch, sidebar, animation, measure, screenSize, map,
  } = state;
  const { isCoordinateSearchActive } = locationSearch;
  const isEventsTabActive = typeof events !== 'undefined' && events.active;
  const isMobile = screenSize.isMobileDevice;
  const isMeasureActive = measure.isActive;
  const isMapAnimating = animation.isPlaying;
  const sidebarActiveTab = sidebar.activeTab;

  return {
    isCoordinateSearchActive,
    isEventsTabActive,
    isMobile,
    isMeasureActive,
    isMapAnimating,
    sidebarActiveTab,
    map,
  };
};

export default connect(
  mapStateToProps,
)(MouseMoveEvents);

MouseMoveEvents.propTypes = {
  compareMapUi: PropTypes.object,
  isCoordinateSearchActive: PropTypes.bool,
  isEventsTabActive: PropTypes.bool,
  isMapAnimating: PropTypes.bool,
  isMeasureActive: PropTypes.bool,
  isMobile: PropTypes.bool,
  sidebarActiveTab: PropTypes.string,
  map: PropTypes.object,
  ui: PropTypes.object,
};
