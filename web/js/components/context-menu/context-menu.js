import { connect } from 'react-redux';
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faToggleOff, faToggleOn } from '@fortawesome/free-solid-svg-icons';
import copy from 'copy-to-clipboard';
import { transform } from 'ol/proj';
import { ContextMenu, MenuItem } from '../../util/context-menu';

import util from '../../util/util';
import CopyClipboardTooltip from '../location-search/copy-tooltip';
import { changeUnits } from '../../modules/measure/actions';
import { getFormattedCoordinates, getNormalizedCoordinate } from '../location-search/util';
import { areCoordinatesWithinExtent } from '../../modules/location-search/util';
import { CONTEXT_MENU_LOCATION, MAP_SINGLE_CLICK, MAP_CONTEXT_MENU } from '../../util/constants';
import { CRS } from '../../modules/map/constants';

const { events } = util;

function RightClickMenu(props) {
  const [show, setShow] = useState(false);
  const [pixelCoords, setPixelCoords] = useState({ pixel: [0, 0] });
  const [toolTipToggleTime, setToolTipToggleTime] = useState(0);
  const [formattedCoordinates, setFormattedCoordinates] = useState();
  const {
    map, proj, unitOfMeasure, onToggleUnits, isCoordinateSearchActive, allMeasurements, measurementIsActive, isMobile,
  } = props;
  const { crs } = proj.selected;
  const measurementsInProj = !!(Object.keys(allMeasurements[crs]) || []).length;
  const handleClick = () => (show ? setShow(false) : null);

  function handleContextEvent(event) {
    if (measurementIsActive) return;
    event.originalEvent.preventDefault();
    const coord = map.getCoordinateFromPixel(event.pixel);
    const tCoord = transform(coord, crs, CRS.GEOGRAPHIC);
    const [lon, lat] = getNormalizedCoordinate(tCoord);

    if (areCoordinatesWithinExtent(proj, [lon, lat])) {
      const fCoord = getFormattedCoordinates([lat, lon]);
      setFormattedCoordinates(fCoord);
      setPixelCoords({ pixel: event.pixel });
      setShow(true);
    } else {
      setShow(false);
    }
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

  function addPlaceMarkerHandler(coords, olMap, crs) {
    events.trigger(CONTEXT_MENU_LOCATION, coords, olMap, crs);
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

  useEffect(() => {
    if (isCoordinateSearchActive) return;
    events.on(MAP_SINGLE_CLICK, handleClick);
    events.on(MAP_CONTEXT_MENU, handleContextEvent);
    return () => {
      events.off(MAP_SINGLE_CLICK, handleClick);
      events.off(MAP_CONTEXT_MENU, handleContextEvent);
    };
  });

  const mobileStyle = isMobile ? 'react-contextmenu-mobile' : '';

  return show && (
    <div id="context-menu">
      <CopyClipboardTooltip
        tooltipToggleTime={toolTipToggleTime}
        clearCopyToClipboardTooltip={() => {}}
        placement="top"
      />
      <ContextMenu id="context-menu-trigger">
        <MenuItem
          onClick={() => copyCoordsToClipboard()}
          attributes={{ id: 'context-menu-copy' }}
          className={mobileStyle}
        >
          <span id="copy-coordinates-to-clipboard-button">
            {formattedCoordinates}
          </span>
        </MenuItem>
        <MenuItem
          onClick={() => addPlaceMarkerHandler(pixelCoords, map, crs)}
          attributes={{ id: 'context-menu-add-marker' }}
          className={mobileStyle}
        >
          Add Place Marker
        </MenuItem>
        <MenuItem divider />
        <MenuItem
          onClick={() => handleMeasurementMenu('distance')}
          attributes={{ id: 'context-menu-measure-distance' }}
          className={mobileStyle}
        >
          Measure Distance
        </MenuItem>
        <MenuItem
          onClick={() => handleMeasurementMenu('area')}
          attributes={{ id: 'context-menu-measure-area' }}
          className={mobileStyle}
        >
          Measure Area
        </MenuItem>
        {measurementsInProj
        && (
        <MenuItem
          onClick={() => handleMeasurementMenu('clear')}
          attributes={{ id: 'context-menu-clear-measurements' }}
          className={mobileStyle}
        >
          Remove Measurements
        </MenuItem>
        )}
        <MenuItem
          onClick={() => handleMeasurementMenu('units')}
          attributes={{ id: 'context-menu-change-units' }}
          className={mobileStyle}
        >
          Change Units to
          {' '}
          {oppositeUnitOfMeasure().oppositeUnit}
        </MenuItem>
      </ContextMenu>
    </div>
  );
}

function mapStateToProps(state) {
  const {
    map, proj, measure, locationSearch, config, screenSize,
  } = state;
  const { unitOfMeasure, allMeasurements, isActive } = measure;
  const { coordinates, isCoordinateSearchActive } = locationSearch;
  return {
    map: map.ui.selected,
    proj,
    unitOfMeasure,
    allMeasurements,
    measurementIsActive: isActive,
    coordinates,
    isCoordinateSearchActive,
    config,
    isMobile: screenSize.isMobileDevice,
  };
}

const mapDispatchToProps = (dispatch) => ({
  onToggleUnits: (unitOfMeasure) => {
    dispatch(changeUnits(unitOfMeasure));
  },
});
RightClickMenu.propTypes = {
  map: PropTypes.object,
  proj: PropTypes.object,
  unitOfMeasure: PropTypes.string,
  onToggleUnits: PropTypes.func,
  isCoordinateSearchActive: PropTypes.bool,
  allMeasurements: PropTypes.object,
  measurementIsActive: PropTypes.bool,
  isMobile: PropTypes.bool,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(RightClickMenu);
