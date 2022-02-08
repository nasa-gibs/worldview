import { connect } from 'react-redux';
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faToggleOff, faToggleOn } from '@fortawesome/free-solid-svg-icons';
import util from '../../util/util';
import CopyClipboardTooltip from '../location-search/copy-tooltip';
import { changeUnits } from '../../modules/measure/actions';

const { events } = util;

function ContextMenu(props) {
  const [show, setShow] = useState(false);
  const [anchorPoint, setAnchorPoint] = useState({ x: 0, y: 0 });
  const [pixelCoords, setPixelCoords] = useState({ pixel: [0, 0] });
  const [coord, setCoord] = useState();
  const [toolTipToggleTime, setToolTipToggleTime] = useState(0);
  const {
    map, crs, unitOfMeasure, onToggleUnits,
  } = props;
  const [getMap, setMap] = useState(map);

  const handleClick = () => (show ? setShow(false) : null);

  function handleContextEvent(event, olMap) {
    event.originalEvent.preventDefault();
    const pixels = event.pixel;
    setPixelCoords({ pixel: pixels });
    setAnchorPoint({ x: pixels[0], y: pixels[1] });
    setCoord(olMap.getCoordinateFromPixel(pixels));
    setMap(olMap);
    setShow(true);
  }

  function copyCoordsToClipboard(coords) {
    navigator.clipboard.writeText(coords);
    // setIsCopied(true);
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
          id="copy-coordinates-to-clipboard-button"
        >
          <li
            onClick={() => copyCoordsToClipboard(coord)}
          >
            <FontAwesomeIcon icon="copy" fixedWidth />
            {' '}
            Copy Coordinates to Clipboard
          </li>
          <li
            onClick={() => addPlaceMarkerHandler(pixelCoords, getMap, crs)}
          >
            <FontAwesomeIcon icon="map-marker-alt" fixedWidth />
            {' '}
            Add a Place Marker
          </li>
          <li
            onClick={() => handleMeasurementMenu('distance')}
          >
            <FontAwesomeIcon icon="ruler" fixedWidth />
            {' '}
            Measure Distance in
            {' '}
            {unitOfMeasure}
          </li>
          <li
            onClick={() => handleMeasurementMenu('area')}
          >
            <FontAwesomeIcon icon="ruler-combined" fixedWidth />
            {' '}
            Measure Area in
            {' '}
            {unitOfMeasure}
          </li>
          <li
            onClick={() => handleMeasurementMenu('clear')}
          >
            <FontAwesomeIcon icon="trash" fixedWidth />
            {' '}
            Remove Measurements
          </li>
          <li
            onClick={() => handleMeasurementMenu('units')}
          >
            {oppositeUnitOfMeasure().fontAwesomeTag}
            {' '}
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
    map, proj, measure,
  } = state;
  const { unitOfMeasure } = measure;
  const { crs } = proj.selected;
  return {
    map, crs, unitOfMeasure,
  };
}

const mapDispatchToProps = (dispatch) => ({
  onToggleUnits: (unitOfMeasure) => {
    dispatch(changeUnits(unitOfMeasure));
  },
});
ContextMenu.propTypes = {
  map: PropTypes.object,
  crs: PropTypes.string,
  unitOfMeasure: PropTypes.string,
  onToggleUnits: PropTypes.func,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ContextMenu);
