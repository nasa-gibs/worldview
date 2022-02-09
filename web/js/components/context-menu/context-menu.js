import { connect } from 'react-redux';
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faToggleOff, faToggleOn } from '@fortawesome/free-solid-svg-icons';
import util from '../../util/util';
import CopyClipboardTooltip from '../location-search/copy-tooltip';
import { changeUnits } from '../../modules/measure/actions';
import { reverseGeocode } from '../../modules/location-search/util-api';
import { getCoordinateFixedPrecision, getFormattedCoordinates } from '../location-search/util';
import { setCoordinates } from '../../modules/location-search/actions';

const { events } = util;

function ContextMenu(props) {
  const [show, setShow] = useState(false);
  const [anchorPoint, setAnchorPoint] = useState({ x: 0, y: 0 });
  const [pixelCoords, setPixelCoords] = useState({ pixel: [0, 0] });
  const [toolTipToggleTime, setToolTipToggleTime] = useState(0);
  const [formattedCoordinates, setFormattedCoordinates] = useState();
  const {
    map, crs, unitOfMeasure, onToggleUnits, updateStateCoordinates,
  } = props;
  const [getMap, setMap] = useState(map);

  const handleClick = () => (show ? setShow(false) : null);

  function handleContextEvent(event, olMap) {
    event.originalEvent.preventDefault();
    const [lon, lat] = olMap.getCoordinateFromPixel(event.pixel);
    const latitude = getCoordinateFixedPrecision(lat);
    const longitude = getCoordinateFixedPrecision(lon);
    setPixelCoords({ pixel: event.pixel });
    setAnchorPoint({ x: event.pixel[0], y: event.pixel[1] });
    updateStateCoordinates([longitude, latitude]);
    setFormattedCoordinates(getFormattedCoordinates(lat, lon));
    setMap(olMap);
    setShow(true);
  }

  function copyCoordsToClipboard() {
    navigator.clipboard.writeText(formattedCoordinates);
    setToolTipToggleTime(Date.now());
    setTimeout(() => {
      setShow(false);
    }, 1500);
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


  useEffect(() => {
    events.on('map:singleclick', handleClick);
    events.on('map:contextmenu', handleContextEvent);

    return () => {
      events.off('map:singleclick', handleClick);
      events.off('map:contextmenu', handleContextEvent);
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
        <ul
          className="context-menu"
          style={{ top: anchorPoint.y, left: anchorPoint.x }}
        >
          <li
            onClick={() => copyCoordsToClipboard()}
            id="copy-coordinates-to-clipboard-button"
          >
            {formattedCoordinates}
          </li>
          <li
            onClick={() => addPlaceMarkerHandler(pixelCoords, getMap, crs)}
            className="endSection"
          >
            Add Place Marker
          </li>
          <li
            onClick={() => handleMeasurementMenu('distance')}
          >
            Measure Distance
          </li>
          <li
            onClick={() => handleMeasurementMenu('area')}
          >
            Measure Area
          </li>
          <li
            onClick={() => handleMeasurementMenu('clear')}
          >
            Remove Measurements
          </li>
          <li
            onClick={() => handleMeasurementMenu('units')}
          >
            Change Units to
            {' '}
            {oppositeUnitOfMeasure().oppositeUnit}
          </li>
        </ul>
      </div>
    );
  }

  return <></>;
}

function mapStateToProps(state) {
  const {
    map, proj, measure, locationSearch, config,
  } = state;
  const { unitOfMeasure } = measure;
  const { crs } = proj.selected;
  const { coordinates } = locationSearch;
  return {
    map,
    crs,
    unitOfMeasure,
    coordinates,
    config,
    getReverseGeocode: (coords) => reverseGeocode(coords, config),
  };
}

const mapDispatchToProps = (dispatch) => ({
  onToggleUnits: (unitOfMeasure) => {
    dispatch(changeUnits(unitOfMeasure));
  },
  updateStateCoordinates: (coordinates) => {
    dispatch(setCoordinates(coordinates));
  },
});
ContextMenu.propTypes = {
  map: PropTypes.object,
  crs: PropTypes.string,
  unitOfMeasure: PropTypes.string,
  onToggleUnits: PropTypes.func,
  updateStateCoordinates: PropTypes.func,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ContextMenu);
