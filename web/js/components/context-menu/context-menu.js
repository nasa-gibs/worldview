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
import { getCoordinateFixedPrecision, getFormattedCoordinates } from '../location-search/util';
import { clearCoordinates, setCoordinates } from '../../modules/location-search/actions';

const { events } = util;

function RightClickMenu(props) {
  const [show, setShow] = useState(false);
  const [pixelCoords, setPixelCoords] = useState({ pixel: [0, 0] });
  const [toolTipToggleTime, setToolTipToggleTime] = useState(0);
  const [formattedCoordinates, setFormattedCoordinates] = useState();
  const {
    map, crs, unitOfMeasure, onToggleUnits, updateStateCoordinates, isCoordinateSearchActive, removeCoordinates,
  } = props;
  const [getMap, setMap] = useState(map);

  const handleClick = () => {
    if (show) {
      removeCoordinates();
    }
    return show ? setShow(false) : null;
  };

  function handleContextEvent(event, olMap) {
    event.originalEvent.preventDefault();
    const coord = olMap.getCoordinateFromPixel(event.pixel);
    const [lon, lat] = transform(coord, crs, 'EPSG:4326');
    const latitude = getCoordinateFixedPrecision(lat);
    const longitude = getCoordinateFixedPrecision(lon);
    setPixelCoords({ pixel: event.pixel });
    updateStateCoordinates([longitude, latitude]);
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

  useEffect(() => {
    if (isCoordinateSearchActive) return;
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
        <ContextMenu id="context-menu-trigger">
          <MenuItem onClick={() => copyCoordsToClipboard()}>
            <div id="copy-coordinates-to-clipboard-button">
              {formattedCoordinates}
            </div>
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
          <MenuItem onClick={() => handleMeasurementMenu('clear')}>
            Remove Measurements
          </MenuItem>
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
  const { unitOfMeasure } = measure;
  const { crs } = proj.selected;
  const { coordinates, isCoordinateSearchActive } = locationSearch;
  return {
    map,
    crs,
    unitOfMeasure,
    coordinates,
    isCoordinateSearchActive,
    config,
  };
}

const mapDispatchToProps = (dispatch) => ({
  onToggleUnits: (unitOfMeasure) => {
    dispatch(changeUnits(unitOfMeasure));
  },
  updateStateCoordinates: (coordinates) => {
    dispatch(setCoordinates(coordinates));
  },
  removeCoordinates: () => {
    dispatch(clearCoordinates());
  },
});
RightClickMenu.propTypes = {
  map: PropTypes.object,
  crs: PropTypes.string,
  unitOfMeasure: PropTypes.string,
  onToggleUnits: PropTypes.func,
  updateStateCoordinates: PropTypes.func,
  isCoordinateSearchActive: PropTypes.bool,
  removeCoordinates: PropTypes.func,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(RightClickMenu);
