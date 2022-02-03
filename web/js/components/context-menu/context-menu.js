import { connect } from 'react-redux';
import React, { useState } from 'react';
// import PropTypes from 'prop-types';
import { Tooltip } from 'reactstrap';
import util from '../../util/util';

const { events } = util;

function ContextMenu(props) {
  const [show, setShow] = useState(false);
  const [anchorPoint, setAnchorPoint] = useState({ x: 0, y: 0 });
  const [coord, setCoord] = useState();
  const [isCopied, setIsCopied] = useState(false);
  // const { map } = props;

  const handleClick = () => (show ? setShow(false) : null);

  function handleContextEvent(event, map, crs) {
    event.originalEvent.preventDefault();
    const pixels = event.pixel;
    setAnchorPoint({ x: pixels[0], y: pixels[1] });
    setCoord(map.getCoordinateFromPixel(pixels));
    setShow(true);
  }

  function copyCoordsToClipboard(coords) {
    navigator.clipboard.writeText(coords);
  }

  events.on('map:singleclick', handleClick);
  events.on('map:contextmenu', handleContextEvent);

  if (show) {
    return (
      <div>
        <Tooltip
          placement="top"
          target="context-menu-list"
          isOpen={isCopied}
          toggle={() => setIsCopied(!isCopied)}
          delay={{ show: 0, hide: 300 }}
        >
          <p>COPIED</p>
        </Tooltip>
        <ul
          className="context-menu"
          style={{ top: anchorPoint.y, left: anchorPoint.x }}
          id="context-menu-list"
        >
          <li
            onClick={copyCoordsToClipboard(coord)}
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
