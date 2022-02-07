import { connect } from 'react-redux';
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import util from '../../util/util';
import CopyClipboardTooltip from '../location-search/copy-tooltip';
import { toggleReverseGeocodeActive } from '../../modules/location-search/actions';

const { events } = util;

function ContextMenu(props) {
  const [show, setShow] = useState(false);
  const [anchorPoint, setAnchorPoint] = useState({ x: 0, y: 0 });
  const [pixelCoords, setPixelCoords] = useState({ pixel: [0, 0] });
  const [coord, setCoord] = useState();
  // const [isCopied, setIsCopied] = useState(false);
  // const [isCopyToolTipVisible, setIsCopyToolTipVisible] = useState(false);
  const [toolTipToggleTime, setToolTipToggleTime] = useState(0);
  const { map, crs, toggleReverseGeocodeActive } = props;
  const [getMap, setMap] = useState(map);

  const handleClick = (event, olMap) => {
    console.debug('click: ', olMap);
    // setIsCopied(false);
    return show ? setShow(false) : null;
  };


  function handleContextEvent(event, olMap) {
    console.debug('right click: ', olMap);
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

  function toggleIsCopyToolTipVisible() {
    // setIsCopied(false);
  }

  function addPlaceMarkerHandler(coordStuff, olMap, crsStuff) {
    console.debug(coordStuff, olMap, crsStuff);
    toggleReverseGeocodeActive(true);
    events.trigger('map:singleclick', coordStuff, olMap, crsStuff);
  }
  useEffect(() => {
    events.on('map:singleclick', handleClick);
    events.on('map:contextmenu', handleContextEvent);


    // if (isCopied) {
    //   return () => {
    //     events.off('map:singleclick', handleClick);
    //     events.off('map:contextmenu', handleContextEvent);
    //   };
    // }

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
          clearCopyToClipboardTooltip={toggleIsCopyToolTipVisible}
        />
        <ul
          className="context-menu"
          style={{ top: anchorPoint.y, left: anchorPoint.x }}
          id="copy-coordinates-to-clipboard-button"
        >
          <li
            onClick={() => copyCoordsToClipboard(coord)}
          >
            Copy Coordinates to Clipboard
          </li>
          <li
            onClick={() => addPlaceMarkerHandler(pixelCoords, getMap, crs)}
          >
            Start a Measurement

          </li>
          <li>
            Add a Place Marker
          </li>
        </ul>
      </div>
    );
  }

  return <></>;
}

function mapStateToProps(state) {
  const {
    map, proj,
  } = state;
  const { crs } = proj.selected;
  return {
    map, crs,
  };
}

const mapDispatchToProps = (dispatch) => ({
  toggleReverseGeocodeActive: (isActive) => {
    dispatch(toggleReverseGeocodeActive(isActive));
  },
});

ContextMenu.propTypes = {
  map: PropTypes.object,
  crs: PropTypes.string,
  toggleReverseGeocodeActive: PropTypes.func.isRequired,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ContextMenu);
