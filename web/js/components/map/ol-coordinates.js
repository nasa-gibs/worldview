import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import {
  throttle as lodashThrottle,
} from 'lodash';
import { transform } from 'ol/proj';
import { UncontrolledTooltip } from 'reactstrap';
import Coordinates from './coordinates';
import util from '../../util/util';
import { getNormalizedCoordinate } from '../location-search/util';
import { changeCoordinateFormat as changeCoordinateFormatAction } from '../../modules/settings/actions';
import { MAP_MOUSE_MOVE, MAP_MOUSE_OUT } from '../../util/constants';
import { CRS } from '../../modules/map/constants';
import usePrevious from '../../util/customHooks';

const { events } = util;
const getContainerWidth = (format) => {
  const formatWidth = {
    'latlon-dd': 230,
    'latlon-dm': 265,
    'latlon-dms': 255,
  };
  return formatWidth[format];
};

function OlCoordinates({ show }) {
  const coordinateFormat = useSelector((state) => state.settings.coordinateFormat);
  const isMobile = useSelector((state) => state.screenSize.isMobileDevice);
  const dispatch = useDispatch();

  const [hasMouse, setHasMouse] = useState(false);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [crs, setCrs] = useState(null);
  const [format, setFormat] = useState(null);
  const [width, setWidth] = useState(null);

  const prevCoordinateFormat = usePrevious(coordinateFormat);

  const clearCoord = () => {
    setLatitude(null);
    setLongitude(null);
  };

  const changeFormat = (newFormat) => {
    dispatch(changeCoordinateFormatAction(newFormat));
    util.setCoordinateFormat(newFormat);
    setFormat(newFormat);
    setWidth(getContainerWidth(newFormat));
  };

  const mouseMoveRef = useRef();
  const mouseOutRef = useRef();

  if (!mouseMoveRef.current) {
    const options = { leading: true, trailing: true };
    mouseMoveRef.current = lodashThrottle(({ pixel }, map, eventCrs) => {
      const coord = map.getCoordinateFromPixel(pixel);
      if (!coord) {
        clearCoord();
        return;
      }
      let pcoord = transform(coord, eventCrs, CRS.GEOGRAPHIC);

      const [lon, lat] = pcoord;
      if (Math.abs(lat) > 90) {
        clearCoord();
        return;
      }
      if (Math.abs(lon) > 180) {
        if (eventCrs === CRS.GEOGRAPHIC && Math.abs(lon) < 250) {
          pcoord = getNormalizedCoordinate([lon, lat]);
        } else {
          clearCoord();
          return;
        }
      }
      setHasMouse(true);
      setLatitude(pcoord[1]);
      setLongitude(pcoord[0]);
      setCrs(eventCrs);
    }, 200, options);

    mouseOutRef.current = lodashThrottle((event) => {
      if (event.relatedTarget && event.relatedTarget.classList) {
        const cl = event.relatedTarget.classList;
        if (cl.contains('wv-coords-map')) {
          return;
        }
      }
      clearCoord();
    }, 200, options);
  }

  // Subscribe to map events
  useEffect(() => {
    const mouseMove = mouseMoveRef.current;
    const mouseOut = mouseOutRef.current;
    events.on(MAP_MOUSE_MOVE, mouseMove);
    events.on(MAP_MOUSE_OUT, mouseOut);

    // Initialize format
    const initFormat = util.getCoordinateFormat();
    setFormat(initFormat);
    setWidth(getContainerWidth(initFormat));

    return () => {
      events.off(MAP_MOUSE_MOVE, mouseMove);
      events.off(MAP_MOUSE_OUT, mouseOut);
      mouseMove.cancel();
      mouseOut.cancel();
    };
  }, []);

  // Sync format when coordinateFormat prop changes from settings
  useEffect(() => {
    if (prevCoordinateFormat !== undefined && prevCoordinateFormat !== coordinateFormat) {
      changeFormat(coordinateFormat);
    }
  }, [coordinateFormat]);

  const coordContainerStyle = isMobile
    ? {
      display: 'none',
    }
    : {
      width,
    };

  return (
    <div id="ol-coords-case" className="wv-coords-container" style={coordContainerStyle}>
      {hasMouse && show && (
        <>
          <Coordinates
            format={format}
            latitude={latitude}
            longitude={longitude}
            crs={crs}
            onFormatChange={changeFormat}
          />
          {latitude && latitude && (
            <UncontrolledTooltip id="center-align-tooltip" placement="bottom" target="ol-coords-case">
              Change coordinates format
            </UncontrolledTooltip>
          )}
        </>
      )}
    </div>
  );
}

OlCoordinates.propTypes = {
  show: PropTypes.bool,
};

export default OlCoordinates;
