import { connect } from 'react-redux';
import React, { useEffect, useState } from 'react';
// import PropTypes from 'prop-types';
import CopyClipboardTooltip from '../location-search/copy-tooltip';
import util from '../../util/util';

const { events } = util;

function ContextMenu(props) {
  const [show, setShow] = useState(false);
  const [anchorPoint, setAnchorPoint] = useState({ x: 0, y: 0 });
  const [coord, setCoord] = useState();
  const [isCopied, setIsCopied] = useState(false);
  // const [isCopyToolTipVisible, setIsCopyToolTipVisible] = useState(false);
  const [toolTipToggleTime, setToolTipToggleTime] = useState(0);
  // const { map } = props;

  const handleClick = () => {
    setIsCopied(false);
    return show ? setShow(false) : null;
  };


  function handleContextEvent(event, map, crs) {
    event.originalEvent.preventDefault();
    const pixels = event.pixel;
    setAnchorPoint({ x: pixels[0], y: pixels[1] });
    setCoord(map.getCoordinateFromPixel(pixels));
    setShow(true);
  }

  function copyCoordsToClipboard(coords) {
    navigator.clipboard.writeText(coords);
    setIsCopied(true);
    setToolTipToggleTime(Date.now());
  }

  function toggleIsCopyToolTipVisible() {
    setIsCopied(false);
  }

  useEffect(() => {
    events.on('map:singleclick', handleClick);
    events.on('map:contextmenu', handleContextEvent);

    if (isCopied) {
      return () => {
        events.off('map:singleclick', handleClick);
        events.off('map:contextmenu', handleContextEvent);
      };
    }
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
          <li>Start a Measurement</li>
          <li>Add a Place Marker</li>
        </ul>
      </div>
    );
  }
  return <></>;
}

function mapStateToProps(state) {
  const {
    map,
  } = state;

  return {
    map,
  };
}

// ContextMenu.propTypes = {
//   map: PropTypes.object,
// };

export default connect(
  mapStateToProps,
)(ContextMenu);
