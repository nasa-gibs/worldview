import React from 'react';
import useContextMenu from './useContextMenu';

const ContextMenu = () => {
  const { anchorPoint, show } = useContextMenu();

  if (show) {
    return (
      <ul
        className="context-menu"
        style={{ top: anchorPoint.y, left: anchorPoint.x }}
      >
        <li>Copy Coordinates to Clipboard</li>
        <li>Start a Measurement</li>
        <li>Add a Place Marker</li>
      </ul>
    );
  }
  return <></>;
};

export default ContextMenu;
