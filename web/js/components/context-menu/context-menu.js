import { connect } from 'react-redux';
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faToggleOff, faToggleOn } from '@fortawesome/free-solid-svg-icons';
import { ContextMenu, MenuItem } from 'react-contextmenu';
import copy from 'copy-to-clipboard';
import { transform } from 'ol/proj';
import util from '../../util/util';
import CopyClipboardTooltip from '../location-search/copy-tooltip';
import { changeUnits } from '../../modules/measure/actions';
import { getFormattedCoordinates } from '../location-search/util';

const { events } = util;

function RightClickMenu(props) {
  const [show, setShow] = useState(false);
  const [pixelCoords, setPixelCoords] = useState({ pixel: [0, 0] });
  const [toolTipToggleTime, setToolTipToggleTime] = useState(0);
  const [formattedCoordinates, setFormattedCoordinates] = useState();
  const [isHoldPress, setIsHoldPress] = useState(false);
  const {
    map, crs, unitOfMeasure, onToggleUnits, isCoordinateSearchActive, allMeasurements, measurementIsActive,
  } = props;
  const [getMap, setMap] = useState(map);
  const measurementsInProj = !!Object.keys(allMeasurements[crs]).length;

  const handleClick = (event) => {
    if (isHoldPress) return;
    return show ? setShow(false) : null;
  };

  function handleContextEvent(event, olMap) {
    if (measurementIsActive) return;
    const incomingEvent = event.type === 'contextmenu' ? event.originalEvent : event;
    incomingEvent.preventDefault();

    const coord = olMap.getCoordinateFromPixel(event.pixel);
    const [lon, lat] = transform(coord, crs, 'EPSG:4326');
    setPixelCoords({ pixel: event.pixel });
    setFormattedCoordinates(getFormattedCoordinates(lat, lon).join(','));
    setMap(olMap);
    setShow(true);
  }

  function copyCoordsToClipboard() {
    const options = {
      format: 'text/plain',
    };
    copy(formattedCoordinates, options);
    setToolTipToggleTime(Date.now());
  }

  function handleMeasurementMenu(action) {
    if (action === 'units') {
      const oppositeUnit = unitOfMeasure === 'km' ? 'mi' : 'km';
      return onToggleUnits(oppositeUnit);
    }
    setShow(false);
    events.trigger(`measure:${action}`);
  }

  function addPlaceMarkerHandler(coords, olMap, crsData) {
    events.trigger('context-menu:location', coords, olMap, crsData);
    setShow(false);
  }

  const oppositeUnitOfMeasure = () => {
    const faToggle = unitOfMeasure === 'km' ? faToggleOff : faToggleOn;
    const oppositeUnit = unitOfMeasure === 'km' ? 'mi' : 'km';
    return {
      oppositeUnit,
      fontAwesomeTag: <FontAwesomeIcon icon={faToggle} />,
    };
  };

  let longPressTimer = null;

  function setTimer(incomingEvent, incomingOlMap) {
    longPressTimer = setTimeout(() => {
      setIsHoldPress(true);
      handleContextEvent(incomingEvent, incomingOlMap);
    }, 1000);
    return longPressTimer;
  }

  function executeTimer(event, olMap) {
    event.pixel = [event.touches[0].clientX, event.touches[0].clientY];
    setTimer(event, olMap);
  }

  function clearTimer() {
    clearTimeout(longPressTimer);
  }

  useEffect(() => {
    if (isCoordinateSearchActive) return;
    events.on('map:singleclick', handleClick);
    events.on('map:contextmenu', handleContextEvent);

    events.on('map:touchstart', executeTimer);
    events.on('map:touchend', clearTimer);

    return () => {
      events.off('map:singleclick', handleClick);
      events.off('map:contextmenu', handleContextEvent);
      events.off('map:touchstart', executeTimer);
      events.off('map:touchend', clearTimer);
    };
  });

  if (show) {
    return (
      <div>
        <CopyClipboardTooltip
          tooltipToggleTime={toolTipToggleTime}
          clearCopyToClipboardTooltip={() => {}}
          placement="top"
        />
        <ContextMenu id="context-menu-trigger">
          <MenuItem onClick={() => copyCoordsToClipboard()}>
            <span id="copy-coordinates-to-clipboard-button">
              {formattedCoordinates}
            </span>
          </MenuItem>
          <MenuItem onClick={() => addPlaceMarkerHandler(pixelCoords, getMap, crs)}>
            Add Place Marker
          </MenuItem>
          <MenuItem divider />
          <MenuItem onClick={() => handleMeasurementMenu('distance')}>
            Measure Distance
          </MenuItem>
          <MenuItem onClick={() => handleMeasurementMenu('area')}>
            Measure Area
          </MenuItem>
          {measurementsInProj
          && (
          <MenuItem
            onClick={() => handleMeasurementMenu('clear')}
          >
            Remove Measurements
          </MenuItem>
          )}
          <MenuItem onClick={() => handleMeasurementMenu('units')}>
            Change Units to
            {' '}
            {oppositeUnitOfMeasure().oppositeUnit}
          </MenuItem>
        </ContextMenu>
      </div>
    );
  }

  return <></>;
}

function mapStateToProps(state) {
  const {
    map, proj, measure, locationSearch, config,
  } = state;
  const { unitOfMeasure, allMeasurements, isActive } = measure;
  const { crs } = proj.selected;
  const { coordinates, isCoordinateSearchActive } = locationSearch;
  return {
    map,
    crs,
    unitOfMeasure,
    allMeasurements,
    measurementIsActive: isActive,
    coordinates,
    isCoordinateSearchActive,
    config,
  };
}

const mapDispatchToProps = (dispatch) => ({
  onToggleUnits: (unitOfMeasure) => {
    dispatch(changeUnits(unitOfMeasure));
  },
});
RightClickMenu.propTypes = {
  map: PropTypes.object,
  crs: PropTypes.string,
  unitOfMeasure: PropTypes.string,
  onToggleUnits: PropTypes.func,
  isCoordinateSearchActive: PropTypes.bool,
  allMeasurements: PropTypes.object,
  measurementIsActive: PropTypes.bool,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(RightClickMenu);
