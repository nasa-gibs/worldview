import React, { useState } from 'react';

import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from 'reactstrap';

function TileImageTestModeDropdown({ activeLayers, layerSelection, setLayerSelection }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggle = () => setDropdownOpen(!dropdownOpen);

  const handleSelection = (layer) => {
    setLayerSelection(layer);
  };

  return (
    <Dropdown isOpen={dropdownOpen} toggle={toggle} className="mb-3 mt-2">
      <DropdownToggle style={{ backgroundColor: '#d54e21' }} caret>
        {layerSelection.id}
      </DropdownToggle>
      <DropdownMenu style={{ transform: 'translate3d(-30px, 0px, 0px)' }} className="bg-dark">
        {activeLayers.map((layer) => (
          <DropdownItem key={layer.id} onClick={() => handleSelection(layer)} className="text-white bg-dark">
            {layer.id}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}

export default TileImageTestModeDropdown;
