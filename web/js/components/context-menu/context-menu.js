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
        <li>Share to..</li>
        <li>Cut</li>
        <li>Copy</li>
        <li>Paste</li>
        <hr />
        <li>Refresh</li>
        <li>Exit</li>
      </ul>
    );
  }
  return <></>;
};

export default ContextMenu;
