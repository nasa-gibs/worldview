import React, { useState } from 'react';
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from 'reactstrap';

export default function BandsDropdown({
  channel, bandSelection, setBandSelection, layer,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggle = () => setDropdownOpen(!dropdownOpen);
  const bandValue = bandSelection[channel] || layer.bandCombo[0];

  const bandChoices = ['B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B08', 'B8A', 'B09', 'B10', 'B11', 'B12'];

  const handleSelection = (band) => {
    setBandSelection({
      ...bandSelection,
      [channel]: band,
    });
  };

  return (
    <Dropdown isOpen={dropdownOpen} toggle={toggle} size="sm">
      <DropdownToggle style={{ backgroundColor: '#d54e21' }} caret>
        {bandValue}
      </DropdownToggle>
      <DropdownMenu style={{ transform: 'translate3d(-30px, 0px, 0px)' }}>
        {bandChoices.map((band) => (
          <DropdownItem key={band} onClick={() => handleSelection(band)}>
            {band}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
